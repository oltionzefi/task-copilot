import { useState, useRef, useCallback } from 'react';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import html2canvas from 'html2canvas';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Camera, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DbTable {
  name: string;
  columns: DbColumn[];
  position?: { x: number; y: number };
}

export interface DbColumn {
  name: string;
  type: string;
  primaryKey?: boolean;
  foreignKey?: boolean;
  nullable?: boolean;
  unique?: boolean;
}

export interface DbRelation {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
}

export interface DbSchemaViewerDialogProps {
  tables: DbTable[];
  relations?: DbRelation[];
  title?: string;
}

const DbSchemaViewerDialog = NiceModal.create<DbSchemaViewerDialogProps>(
  ({ tables, relations = [], title = 'Database Schema' }) => {
    const modal = useModal();
    const schemaRef = useRef<HTMLDivElement>(null);
    const [zoom, setZoom] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [offset, setOffset] = useState({ x: 0, y: 0 });

    // Auto-layout tables if positions not provided
    const layoutTables = useCallback(() => {
      const cols = Math.ceil(Math.sqrt(tables.length));
      return tables.map((table, idx) => ({
        ...table,
        position: table.position || {
          x: 50 + (idx % cols) * 350,
          y: 50 + Math.floor(idx / cols) * 300,
        },
      }));
    }, [tables]);

    const layoutedTables = layoutTables();

    const handleScreenshot = async () => {
      if (!schemaRef.current) return;
      
      try {
        const canvas = await html2canvas(schemaRef.current, {
          backgroundColor: '#ffffff',
          scale: 2,
        });
        
        const link = document.createElement('a');
        link.download = `db-schema-${Date.now()}.png`;
        link.href = canvas.toDataURL();
        link.click();
      } catch (err) {
        console.error('Screenshot failed:', err);
      }
    };

    const handleDownloadSchema = () => {
      const schemaData = {
        tables,
        relations,
        exportedAt: new Date().toISOString(),
      };
      
      const blob = new Blob([JSON.stringify(schemaData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `db-schema-${Date.now()}.json`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
      if (e.button === 0) {
        setIsDragging(true);
        setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
      }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
      if (isDragging) {
        setOffset({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const zoomIn = () => setZoom((z) => Math.min(z + 0.1, 2));
    const zoomOut = () => setZoom((z) => Math.max(z - 0.1, 0.5));
    const resetView = () => {
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };

    const getTablePosition = (tableName: string) => {
      const table = layoutedTables.find((t) => t.name === tableName);
      return table?.position || { x: 0, y: 0 };
    };

    return (
      <Dialog
        open={modal.visible}
        onOpenChange={(open) => !open && modal.remove()}
      >
        <DialogContent className="max-w-[95vw] max-h-[95vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              Visual representation of the database schema. Drag to pan, use
              toolbar to zoom or export.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2 items-center justify-between border-b pb-3">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={zoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={resetView}>
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={zoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground px-2 py-1">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleScreenshot}>
                <Camera className="h-4 w-4 mr-2" />
                Screenshot
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadSchema}>
                <Download className="h-4 w-4 mr-2" />
                Download JSON
              </Button>
            </div>
          </div>

          <div
            className="flex-1 overflow-hidden bg-muted/20 rounded-lg border relative"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          >
            <div
              ref={schemaRef}
              className="absolute inset-0 p-4"
              style={{
                transform: `scale(${zoom}) translate(${offset.x / zoom}px, ${offset.y / zoom}px)`,
                transformOrigin: '0 0',
                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
              }}
            >
              <svg
                className="absolute inset-0 pointer-events-none"
                style={{ width: '100%', height: '100%', zIndex: 1 }}
              >
                {relations.map((rel, idx) => {
                  const fromPos = getTablePosition(rel.fromTable);
                  const toPos = getTablePosition(rel.toTable);
                  const fromX = fromPos.x + 150;
                  const fromY = fromPos.y + 40;
                  const toX = toPos.x;
                  const toY = toPos.y + 40;

                  return (
                    <g key={idx}>
                      <line
                        x1={fromX}
                        y1={fromY}
                        x2={toX}
                        y2={toY}
                        stroke="#94a3b8"
                        strokeWidth="2"
                        markerEnd="url(#arrowhead)"
                      />
                      <text
                        x={(fromX + toX) / 2}
                        y={(fromY + toY) / 2 - 5}
                        fontSize="11"
                        fill="#64748b"
                        className="select-none"
                      >
                        {rel.type}
                      </text>
                    </g>
                  );
                })}
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="10"
                    refX="9"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3, 0 6" fill="#94a3b8" />
                  </marker>
                </defs>
              </svg>

              {layoutedTables.map((table) => (
                <div
                  key={table.name}
                  className="absolute bg-background border rounded-lg shadow-md"
                  style={{
                    left: table.position!.x,
                    top: table.position!.y,
                    width: '300px',
                    zIndex: 2,
                  }}
                >
                  <div className="bg-primary text-primary-foreground px-3 py-2 rounded-t-lg font-semibold text-sm">
                    {table.name}
                  </div>
                  <div className="divide-y">
                    {table.columns.map((col, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          'px-3 py-2 text-xs flex items-center justify-between',
                          col.primaryKey && 'bg-yellow-50 dark:bg-yellow-950/20'
                        )}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span
                            className={cn(
                              'font-medium truncate',
                              col.primaryKey && 'text-yellow-700 dark:text-yellow-400'
                            )}
                          >
                            {col.name}
                          </span>
                          <span className="text-muted-foreground text-[10px]">
                            {col.type}
                          </span>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          {col.primaryKey && (
                            <span className="text-yellow-600 dark:text-yellow-400 text-[10px] font-bold">
                              PK
                            </span>
                          )}
                          {col.foreignKey && (
                            <span className="text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                              FK
                            </span>
                          )}
                          {col.unique && (
                            <span className="text-purple-600 dark:text-purple-400 text-[10px]">
                              UQ
                            </span>
                          )}
                          {!col.nullable && (
                            <span className="text-red-600 dark:text-red-400 text-[10px]">
                              NN
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-xs text-muted-foreground pt-2 border-t">
            <span className="font-semibold">Legend:</span> PK = Primary Key, FK
            = Foreign Key, UQ = Unique, NN = Not Null
          </div>
        </DialogContent>
      </Dialog>
    );
  }
);

export default DbSchemaViewerDialog;
