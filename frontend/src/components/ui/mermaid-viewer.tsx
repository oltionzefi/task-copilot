import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Card } from './card';
import { Loader } from './loader';

interface MermaidViewerProps {
  chart: string;
  className?: string;
}

export function MermaidViewer({ chart, className = '' }: MermaidViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [svgContent, setSvgContent] = useState<string>('');

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: 'inherit',
    });
  }, []);

  useEffect(() => {
    if (!chart || !containerRef.current) {
      return;
    }

    const renderChart = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const uniqueId = `mermaid-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 9)}`;
        const { svg } = await mermaid.render(uniqueId, chart);
        setSvgContent(svg);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to render diagram';
        setError(errorMessage);
        console.error('Mermaid rendering error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    renderChart();
  }, [chart]);

  if (isLoading) {
    return (
      <Card className={`flex items-center justify-center p-8 ${className}`}>
        <Loader />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="text-destructive">
          <p className="font-semibold">Failed to render diagram</p>
          <p className="text-sm mt-2">{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-4 overflow-auto ${className}`}>
      <div
        ref={containerRef}
        className="flex items-center justify-center"
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
    </Card>
  );
}
