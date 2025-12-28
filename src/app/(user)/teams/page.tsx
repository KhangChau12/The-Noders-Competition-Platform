import { redirect } from 'next/navigation';

export default function TeamsPage() {
  // Redirect to dashboard where teams are now displayed
  redirect('/dashboard');
}
