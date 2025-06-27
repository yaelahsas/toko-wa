import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export function ProductSkeleton() {
  return (
    <Card className="bg-white rounded-xl overflow-hidden shadow-lg">
      <Skeleton className="w-full h-32" />
      <CardContent className="p-3">
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-3 w-full mb-1" />
        <Skeleton className="h-3 w-2/3 mb-3" />
        <div className="flex items-center justify-between mb-2">
          <div>
            <Skeleton className="h-5 w-20 mb-1" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="w-8 h-8 rounded" />
            <Skeleton className="w-8 h-6" />
            <Skeleton className="w-8 h-8 rounded" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      {Array.from({ length: count }).map((_, index) => (
        <ProductSkeleton key={index} />
      ))}
    </div>
  );
}
