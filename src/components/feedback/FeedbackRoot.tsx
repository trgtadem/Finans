import React from 'react';
import { Toast } from './Toast';
import { ConfirmDialog } from './ConfirmDialog';

/**
 * Uygulama köküne bir kez eklenir; toast ve onay diyaloglarını render eder.
 */
export function FeedbackRoot() {
    return (
        <>
            <Toast />
            <ConfirmDialog />
        </>
    );
}
