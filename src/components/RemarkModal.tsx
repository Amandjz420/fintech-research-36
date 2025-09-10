
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Label } from './ui/label';
import { Entry, apiService } from '../services/api';
import { Loader2 } from 'lucide-react';

interface RemarkModalProps {
  entry: Entry;
  isOpen: boolean;
  onClose: () => void;
  onRemarkUpdated: () => void;
}

const RemarkModal: React.FC<RemarkModalProps> = ({
  entry,
  isOpen,
  onClose,
  onRemarkUpdated
}) => {
  const [remark, setRemark] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!remark.trim()) return;

    setIsSubmitting(true);
    try {
      await apiService.updateRemarks(entry.id, remark);
      onRemarkUpdated();
      onClose();
      setRemark('');
    } catch (error) {
      console.error('Error submitting remark:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRemark('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Remark</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-600">Entry Details</Label>
            <div className="mt-2 p-3 bg-gray-50 rounded-md">
              <h4 className="font-medium text-gray-900">{entry.title}</h4>
              <p className="text-sm text-gray-600 mt-1">
                {new Date(entry.date).toLocaleDateString()}
              </p>
              {entry.extra_info_text && (
                <p className="text-sm text-gray-700 mt-2 line-clamp-3">
                  {entry.extra_info_text}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="remark" className="text-sm font-medium text-gray-700">
              Remark
            </Label>
            <Textarea
              id="remark"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Enter your remark here..."
              className="mt-1"
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!remark.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Remark'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RemarkModal;
