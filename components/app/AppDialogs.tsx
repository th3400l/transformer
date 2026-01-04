/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FeedbackDialog } from './FeedbackDialog';
import { DownloadIntentDialog } from './DownloadIntentDialog';
import { GenerationLimitDialog } from './GenerationLimitDialog';
import { CustomFontUploadDialog } from '../CustomFontUploadDialog';
import { BulkDownloadModal } from '../BulkDownloadProgress';
import { DownloadIntent, GenerationLimitDialogState } from '../../app/constants';
import { MAX_CUSTOM_FONTS } from '../../types/customFontUpload';
import { ICustomFontUploadManager } from '../../types/customFontUpload';
import { IFontManager } from '../../types/fonts';
import { DownloadStatus } from '../../hooks/useBulkDownload';
import { BulkDownloadProgress, BulkDownloadResult } from '../../services/bulkDownloadManager';

export interface AppDialogsProps {
  // Feedback dialog
  showFeedbackDialog: boolean;
  supportEmail: string;
  onCloseFeedbackDialog: () => void;
  onFeedbackEmail: () => void;
  onFeedbackShare: () => Promise<void>;

  // Download intent dialog
  downloadIntent: DownloadIntent | null;
  downloadCountdown: number;
  onCloseDownloadIntent: () => void;
  onShareSite: () => Promise<void>;
  onPresentRose: () => void;

  // Generation limit dialog
  generationLimitDialog: GenerationLimitDialogState | null;
  onCloseGenerationLimitDialog: () => void;

  // Custom font upload dialog
  showCustomFontDialog: boolean;
  customFontUploadManager: ICustomFontUploadManager | null;
  fontManager: IFontManager | null;
  onCloseCustomFontDialog: () => void;

  // Bulk download modal
  showDownloadModal: boolean;
  bulkDownloadStatus: DownloadStatus;
  bulkDownloadProgress: BulkDownloadProgress | null;
  bulkDownloadResult: BulkDownloadResult | null;
  onCloseDownloadModal: () => void;
}

export const AppDialogs: React.FC<AppDialogsProps> = ({
  showFeedbackDialog,
  supportEmail,
  onCloseFeedbackDialog,
  onFeedbackEmail,
  onFeedbackShare,
  downloadIntent,
  downloadCountdown,
  onCloseDownloadIntent,
  onShareSite,
  onPresentRose,
  generationLimitDialog,
  onCloseGenerationLimitDialog,
  showCustomFontDialog,
  customFontUploadManager,
  fontManager,
  onCloseCustomFontDialog,
  showDownloadModal,
  bulkDownloadStatus,
  bulkDownloadProgress,
  bulkDownloadResult,
  onCloseDownloadModal
}) => {
  return (
    <>
      <FeedbackDialog
        isOpen={showFeedbackDialog}
        supportEmail={supportEmail}
        onClose={onCloseFeedbackDialog}
        onEmail={onFeedbackEmail}
        onShare={onFeedbackShare}
      />

      <DownloadIntentDialog
        intent={downloadIntent}
        countdown={downloadCountdown}
        onDismiss={onCloseDownloadIntent}
        onShare={onShareSite}
        onPresentRose={onPresentRose}
      />

      <GenerationLimitDialog
        dialog={generationLimitDialog}
        onClose={onCloseGenerationLimitDialog}
      />

      {showCustomFontDialog && customFontUploadManager && fontManager && (
        <CustomFontUploadDialog
          isOpen={showCustomFontDialog}
          onClose={onCloseCustomFontDialog}
          onUpload={(file) => customFontUploadManager.uploadFont(file)}
          onRemoveFont={(fontId) => customFontUploadManager.removeCustomFont(fontId)}
          onReplaceFont={async (fontId, file) => { await customFontUploadManager.replaceFont(fontId, file); }}
          maxCustomFonts={MAX_CUSTOM_FONTS}
          currentCount={fontManager.getCustomFonts().length}
          customFonts={fontManager.getCustomFonts()}
        />
      )}

      <BulkDownloadModal
        isOpen={showDownloadModal}
        status={bulkDownloadStatus}
        progress={bulkDownloadProgress}
        result={bulkDownloadResult}
        onClose={onCloseDownloadModal}
      />
    </>
  );
};
