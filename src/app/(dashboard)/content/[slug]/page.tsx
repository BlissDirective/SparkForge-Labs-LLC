'use client';

import { useParams } from 'next/navigation';
import { useContentBySlug } from '@/hooks/useContent';
import { LessonViewer } from '@/components/content/LessonViewer';
import { QuizEngine } from '@/components/content/QuizEngine';
import { SparkFactViewer } from '@/components/content/SparkFactViewer';
import { ContentListSkeleton } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';

export default function ContentPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { data, isLoading, error } = useContentBySlug(slug);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto">
        <ContentListSkeleton count={3} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <EmptyState
        icon="🔍"
        title="Content Not Found"
        description="We couldn't find that content. It may have been moved or removed."
        action={{ label: 'Reload', onClick: () => window.location.reload() }}
      />
    );
  }

  switch (data.type) {
    case 'quiz':
      return <QuizEngine content={data} />;
    case 'spark_fact':
      return <SparkFactViewer content={data} />;
    case 'lesson':
    case 'activity':
    default:
      return <LessonViewer content={data} />;
  }
}
