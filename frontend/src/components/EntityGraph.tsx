import React, { useState } from 'react';
import { InvestigationRelationship } from '../types';
import { Globe, Phone, CreditCard, Building2, FileText, ArrowRight, ShieldAlert } from 'lucide-react';

interface EntityGraphProps {
  relationships: InvestigationRelationship[];
}

export const EntityGraph: React.FC<EntityGraphProps> = ({ relationships }) => {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  if (!relationships || relationships.length === 0) {
    return (
      <div className="p-8 text-center bg-surface rounded-apple border border-border text-muted">
        <ShieldAlert className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No cross-entity relationships established yet.</p>
        <p className="text-xs text-muted mt-1">Add messages, URLs, or UPI payment details to map the scam journey.</p>
      </div>
    );
  }

  // Derive unique nodes
  const nodesMap = new Map<string, { id: string; type: string; label: string }>();
  relationships.forEach((rel) => {
    nodesMap.set(rel.source_entity_id, {
      id: rel.source_entity_id,
      type: rel.source_entity_type,
      label: rel.source_label,
    });
    nodesMap.set(rel.target_entity_id, {
      id: rel.target_entity_id,
      type: rel.target_entity_type,
      label: rel.target_label,
    });
  });

  const nodes = Array.from(nodesMap.values());

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'URL':
        return <Globe className="w-4 h-4 text-blue-600" />;
      case 'PHONE':
        return <Phone className="w-4 h-4 text-emerald-600" />;
      case 'UPI_VPA':
        return <CreditCard className="w-4 h-4 text-purple-600" />;
      case 'ORGANIZATION':
        return <Building2 className="w-4 h-4 text-amber-600" />;
      case 'EVIDENCE':
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="bg-surface rounded-apple border border-border p-6 shadow-subtle">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
        <div>
          <h3 className="text-base font-semibold text-foreground tracking-tight">Scam Journey Intelligence Graph</h3>
          <p className="text-xs text-muted">Visual entity correlation across communication vectors</p>
        </div>
        <span className="text-xs font-medium px-2.5 py-1 bg-gray-100 rounded-full text-foreground">
          {nodes.length} Entities · {relationships.length} Relationships
        </span>
      </div>

      {/* Visual Entity Grid & Connections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {nodes.map((node) => {
          const isSelected = selectedNode === node.id;
          return (
            <button
              key={node.id}
              onClick={() => setSelectedNode(isSelected ? null : node.id)}
              className={`text-left p-3.5 rounded-apple-sm border transition-all ${
                isSelected
                  ? 'border-accent bg-accent-subtle shadow-sm'
                  : 'border-border bg-background hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="p-1 rounded-md bg-white border border-border shadow-xs">
                  {getEntityIcon(node.type)}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                  {node.type}
                </span>
              </div>
              <p className="text-sm font-medium text-foreground truncate">{node.label}</p>
            </button>
          );
        })}
      </div>

      {/* Relationship Connections Table */}
      <div className="mt-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Connected Relationships</h4>
        <div className="space-y-2">
          {relationships
            .filter((rel) => !selectedNode || rel.source_entity_id === selectedNode || rel.target_entity_id === selectedNode)
            .map((rel) => (
              <div
                key={rel.id}
                className="flex items-center justify-between p-2.5 bg-background rounded-apple-sm border border-border text-xs"
              >
                <div className="flex items-center gap-2 truncate max-w-[75%]">
                  <span className="font-medium text-foreground truncate">{rel.source_label}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-muted shrink-0" />
                  <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-mono text-[10px] tracking-tight shrink-0">
                    {rel.relationship_type.replace(/_/g, ' ')}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-muted shrink-0" />
                  <span className="font-medium text-foreground truncate">{rel.target_label}</span>
                </div>
                <span className="text-muted shrink-0">{rel.confidence}% Conf.</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
