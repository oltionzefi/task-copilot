import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ProjectCreatedGreetingProps {
  projectName: string;
  onDismiss: () => void;
}

const greetings = [
  'Happy coding!',
  'Let\'s build something amazing!',
  'Time to create magic!',
  'Ready to ship greatness!',
  'Your next masterpiece awaits!',
];

export function ProjectCreatedGreeting({
  projectName,
  onDismiss,
}: ProjectCreatedGreetingProps) {
  const [greeting] = useState(
    () => greetings[Math.floor(Math.random() * greetings.length)]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-right duration-300">
      <Alert variant="success" className="max-w-sm shadow-lg">
        <Sparkles className="h-4 w-4" />
        <AlertDescription className="flex flex-col gap-1">
          <span className="font-semibold">{projectName}</span>
          <span className="text-sm">{greeting}</span>
        </AlertDescription>
      </Alert>
    </div>
  );
}
