import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MermaidViewer } from '@/components/ui/mermaid-viewer';

export interface MermaidDialogProps {
  title?: string;
  description?: string;
  chart: string;
}

export const MermaidDialog = NiceModal.create<MermaidDialogProps>(
  ({ title = 'Flow Diagram', description, chart }) => {
    const modal = useModal();

    return (
      <Dialog open={modal.visible} onOpenChange={(open) => !open && modal.hide()}>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            <MermaidViewer chart={chart} />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button onClick={modal.hide} variant="outline">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
);
