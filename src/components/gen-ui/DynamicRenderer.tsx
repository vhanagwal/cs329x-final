import React from 'react';
import { UIComponent } from '@/types/schema';
import { LayoutContainer, Panel } from './LayoutPrimitives';
import { 
  RichTextEditor, 
  OutlineView, 
  KanbanBoard, 
  AIChat, 
  MindMap,
  StatsWidget,
  ResearchWidget,
  TimelineWidget,
  CritiqueWidget
} from './Widgets';

interface DynamicRendererProps {
  component: UIComponent;
}

export const DynamicRenderer: React.FC<DynamicRendererProps> = ({ component }) => {
  const { type, children, title, flex } = component;

  // Render Layouts
  if (type === 'layout-row' || type === 'layout-col') {
    return (
      <LayoutContainer type={type} className={`flex-${flex}`}>
        {children?.map((child) => (
          <DynamicRenderer key={child.id} component={child} />
        ))}
      </LayoutContainer>
    );
  }

  // Handle layout-split as a row with equal children
  if (type === 'layout-split') {
    return (
      <LayoutContainer type="layout-row">
        {children?.map((child) => (
          <DynamicRenderer key={child.id} component={child} />
        ))}
      </LayoutContainer>
    );
  }

  // Render Widgets (wrapped in Panel)
  let content = null;
  switch (type) {
    case 'widget-editor':
      content = <RichTextEditor />;
      break;
    case 'widget-outline':
      content = <OutlineView />;
      break;
    case 'widget-kanban':
      content = <KanbanBoard />;
      break;
    case 'widget-chat':
      content = <AIChat />;
      break;
    case 'widget-mindmap':
      content = <MindMap />;
      break;
    case 'widget-stats':
      content = <StatsWidget />;
      break;
    case 'widget-research':
      content = <ResearchWidget />;
      break;
    case 'widget-timeline':
      content = <TimelineWidget />;
      break;
    case 'widget-critique':
      content = <CritiqueWidget />;
      break;
    default:
      content = (
        <div className="text-amber-600 p-4 bg-amber-50 rounded text-sm">
          Unknown Component: {type}
        </div>
      );
  }

  return (
    <Panel title={title} flex={flex}>
      {content}
    </Panel>
  );
};
