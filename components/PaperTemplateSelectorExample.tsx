/**
 * Example usage of PaperTemplateSelector component
 * Shows how to integrate the component with dependency injection
 */

import React, { useState } from 'react';
import { PaperTemplateSelector } from './PaperTemplateSelector';
import { TemplateProvider } from '../services/paperTemplateProvider';

// Example of how to use the PaperTemplateSelector component
export const PaperTemplateSelectorExample: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('blank-1');
  
  // Create template provider instance (in real app, this would come from service container)
  const templateProvider = new TemplateProvider();

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    console.log('Selected template:', templateId);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-[var(--text-color)] mb-4">
        Paper Template Selection
      </h2>
      
      <div className="mb-4">
        <p className="text-[var(--text-muted)]">
          Current selection: <span className="font-medium text-[var(--text-color)]">{selectedTemplate}</span>
        </p>
      </div>

      <PaperTemplateSelector
        templateProvider={templateProvider}
        selectedTemplate={selectedTemplate}
        onTemplateChange={handleTemplateChange}
        className="border border-[var(--panel-border)] rounded-lg p-4"
      />
    </div>
  );
};

export default PaperTemplateSelectorExample;