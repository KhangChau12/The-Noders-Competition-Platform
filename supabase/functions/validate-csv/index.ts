// Follow this setup guide to integrate the Deno runtime into your project:
// https://deno.land/manual/getting_started/setup_your_environment
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log('CSV Validation Function Started')

serve(async (req) => {
  try {
    // Parse request
    const { submissionId } = await req.json()

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get submission details
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .select(`
        *,
        competition:competitions(*)
      `)
      .eq('id', submissionId)
      .single()

    if (submissionError) {
      throw new Error(`Failed to fetch submission: ${submissionError.message}`)
    }

    // Download submission file
    const { data: submissionFile, error: fileError } = await supabase.storage
      .from('submissions')
      .download(submission.file_path)

    if (fileError) {
      throw new Error(`Failed to download submission: ${fileError.message}`)
    }

    // Get answer key for this phase
    const { data: answerKey, error: answerKeyError } = await supabase
      .from('test_datasets')
      .select('file_path')
      .eq('competition_id', submission.competition_id)
      .eq('phase', submission.phase)
      .single()

    if (answerKeyError) {
      throw new Error(`Answer key not found: ${answerKeyError.message}`)
    }

    // Download answer key
    const { data: answerFile, error: answerFileError } = await supabase.storage
      .from('answer-keys')
      .download(answerKey.file_path)

    if (answerFileError) {
      throw new Error(`Failed to download answer key: ${answerFileError.message}`)
    }

    // Parse CSV files
    const submissionText = await submissionFile.text()
    const answerText = await answerFile.text()

    const submissionRows = parseCSV(submissionText)
    const answerRows = parseCSV(answerText)

    // Validate CSV
    const validation = validateCSV(submissionRows, answerRows)

    if (!validation.valid) {
      // Update submission with validation errors
      await supabase
        .from('submissions')
        .update({
          validation_status: 'invalid',
          validation_errors: validation.errors,
          processed_at: new Date().toISOString(),
        })
        .eq('id', submissionId)

      return new Response(
        JSON.stringify({
          success: false,
          errors: validation.errors,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // If valid, calculate score based on competition metric
    const scoringMetric = submission.competition.scoring_metric || 'f1_score'
    const score = calculateScore(submissionRows, answerRows, scoringMetric)

    // Update submission
    await supabase
      .from('submissions')
      .update({
        validation_status: 'valid',
        score: score,
        processed_at: new Date().toISOString(),
      })
      .eq('id', submissionId)

    return new Response(
      JSON.stringify({
        success: true,
        score: score,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

// Helper function to parse CSV
function parseCSV(text: string): Array<{ id: string; value: string }> {
  const lines = text.trim().split('\n')
  const headers = lines[0].split(',').map((h) => h.trim())

  const data: Array<{ id: string; value: string }> = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim())
    data.push({
      id: values[0],
      value: values[1],
    })
  }

  return data
}

// Validate CSV submission
function validateCSV(
  submission: Array<{ id: string; value: string }>,
  answer: Array<{ id: string; value: string }>
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check row count
  if (submission.length !== answer.length) {
    errors.push(`Row count mismatch: expected ${answer.length}, got ${submission.length}`)
  }

  // Build ID sets
  const submissionIds = new Set(submission.map((row) => row.id))
  const answerIds = new Set(answer.map((row) => row.id))

  // Check for missing IDs
  for (const id of answerIds) {
    if (!submissionIds.has(id)) {
      errors.push(`Missing ID: ${id}`)
    }
  }

  // Check for duplicate IDs
  if (submissionIds.size !== submission.length) {
    errors.push('Duplicate IDs found')
  }

  // Check for empty values
  for (const row of submission) {
    if (!row.id || !row.value) {
      errors.push('CSV contains empty values')
      break
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// Main scoring function - routes to appropriate metric calculator
function calculateScore(
  submission: Array<{ id: string; value: string }>,
  answer: Array<{ id: string; value: string }>,
  metric: string
): number {
  switch (metric) {
    case 'f1_score':
      return calculateF1Score(submission, answer)
    case 'accuracy':
      return calculateAccuracy(submission, answer)
    case 'precision':
      return calculatePrecision(submission, answer)
    case 'recall':
      return calculateRecall(submission, answer)
    case 'mae':
      return calculateMAE(submission, answer)
    case 'rmse':
      return calculateRMSE(submission, answer)
    default:
      console.warn(`Unknown metric: ${metric}, defaulting to F1 Score`)
      return calculateF1Score(submission, answer)
  }
}

// ============================================================================
// CLASSIFICATION METRICS
// ============================================================================

// Calculate Accuracy
function calculateAccuracy(
  submission: Array<{ id: string; value: string }>,
  answer: Array<{ id: string; value: string }>
): number {
  const answerMap = new Map(answer.map((row) => [row.id, row.value]))
  const submissionMap = new Map(submission.map((row) => [row.id, row.value]))

  let correct = 0
  let total = 0

  for (const [id, trueLabel] of answerMap) {
    const predLabel = submissionMap.get(id)
    if (predLabel === trueLabel) {
      correct++
    }
    total++
  }

  return total > 0 ? correct / total : 0
}

// Calculate Precision (Macro-averaged)
function calculatePrecision(
  submission: Array<{ id: string; value: string }>,
  answer: Array<{ id: string; value: string }>
): number {
  const answerMap = new Map(answer.map((row) => [row.id, row.value]))
  const submissionMap = new Map(submission.map((row) => [row.id, row.value]))

  const allLabels = new Set([
    ...answer.map((row) => row.value),
    ...submission.map((row) => row.value),
  ])

  let totalPrecision = 0
  let classCount = 0

  for (const label of allLabels) {
    let tp = 0
    let fp = 0

    for (const [id, trueLabel] of answerMap) {
      const predLabel = submissionMap.get(id)

      if (predLabel === label) {
        if (trueLabel === label) {
          tp++
        } else {
          fp++
        }
      }
    }

    if (tp + fp > 0) {
      totalPrecision += tp / (tp + fp)
      classCount++
    }
  }

  return classCount > 0 ? totalPrecision / classCount : 0
}

// Calculate Recall (Macro-averaged)
function calculateRecall(
  submission: Array<{ id: string; value: string }>,
  answer: Array<{ id: string; value: string }>
): number {
  const answerMap = new Map(answer.map((row) => [row.id, row.value]))
  const submissionMap = new Map(submission.map((row) => [row.id, row.value]))

  const allLabels = new Set([
    ...answer.map((row) => row.value),
    ...submission.map((row) => row.value),
  ])

  let totalRecall = 0
  let classCount = 0

  for (const label of allLabels) {
    let tp = 0
    let fn = 0

    for (const [id, trueLabel] of answerMap) {
      const predLabel = submissionMap.get(id)

      if (trueLabel === label) {
        if (predLabel === label) {
          tp++
        } else {
          fn++
        }
      }
    }

    if (tp + fn > 0) {
      totalRecall += tp / (tp + fn)
      classCount++
    }
  }

  return classCount > 0 ? totalRecall / classCount : 0
}

// Calculate F1 Score (Macro-averaged)
function calculateF1Score(
  submission: Array<{ id: string; value: string }>,
  answer: Array<{ id: string; value: string }>
): number {
  const answerMap = new Map(answer.map((row) => [row.id, row.value]))
  const submissionMap = new Map(submission.map((row) => [row.id, row.value]))

  const allLabels = new Set([
    ...answer.map((row) => row.value),
    ...submission.map((row) => row.value),
  ])

  let totalF1 = 0
  let classCount = 0

  for (const label of allLabels) {
    let tp = 0
    let fp = 0
    let fn = 0

    for (const [id, trueLabel] of answerMap) {
      const predLabel = submissionMap.get(id)

      if (trueLabel === label && predLabel === label) {
        tp++
      } else if (trueLabel !== label && predLabel === label) {
        fp++
      } else if (trueLabel === label && predLabel !== label) {
        fn++
      }
    }

    if (tp + fp + fn > 0) {
      const precision = tp / (tp + fp) || 0
      const recall = tp / (tp + fn) || 0
      const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0
      totalF1 += f1
      classCount++
    }
  }

  return classCount > 0 ? totalF1 / classCount : 0
}

// ============================================================================
// REGRESSION METRICS
// ============================================================================

// Calculate MAE (Mean Absolute Error)
function calculateMAE(
  submission: Array<{ id: string; value: string }>,
  answer: Array<{ id: string; value: string }>
): number {
  const answerMap = new Map(answer.map((row) => [row.id, parseFloat(row.value)]))
  const submissionMap = new Map(submission.map((row) => [row.id, parseFloat(row.value)]))

  let totalError = 0
  let count = 0

  for (const [id, trueValue] of answerMap) {
    const predValue = submissionMap.get(id)

    if (predValue !== undefined && !isNaN(predValue) && !isNaN(trueValue)) {
      totalError += Math.abs(trueValue - predValue)
      count++
    }
  }

  return count > 0 ? totalError / count : 0
}

// Calculate RMSE (Root Mean Squared Error)
function calculateRMSE(
  submission: Array<{ id: string; value: string }>,
  answer: Array<{ id: string; value: string }>
): number {
  const answerMap = new Map(answer.map((row) => [row.id, parseFloat(row.value)]))
  const submissionMap = new Map(submission.map((row) => [row.id, parseFloat(row.value)]))

  let totalSquaredError = 0
  let count = 0

  for (const [id, trueValue] of answerMap) {
    const predValue = submissionMap.get(id)

    if (predValue !== undefined && !isNaN(predValue) && !isNaN(trueValue)) {
      const error = trueValue - predValue
      totalSquaredError += error * error
      count++
    }
  }

  return count > 0 ? Math.sqrt(totalSquaredError / count) : 0
}
