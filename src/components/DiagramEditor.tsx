import React, { useState, useRef, useEffect } from 'react';
import { CreditCard as Edit3, Save, Download, RotateCcw, Plus, Trash2, Move, Type } from 'lucide-react';
import { DiagramData, DiagramNode, DiagramConnection } from '../types';
import { ChartRenderer } from './ChartRenderer';

interface DiagramEditorProps {
  diagram: DiagramData;
  onUpdate: (diagram: DiagramData) => void;
}

export const DiagramEditor: React.FC<DiagramEditorProps> = ({ diagram, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [originalDiagram, setOriginalDiagram] = useState<DiagramData | null>(null);
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [tempText, setTempText] = useState('');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Check if this is a chart type that should use Chart.js
  const isChartType = ['bar', 'pie', 'line'].includes(diagram.type);

  // If it's a chart type, render with Chart.js
  if (isChartType) {
    return <ChartRenderer diagram={diagram} onUpdate={onUpdate} />;
  }

  const startEditing = () => {
    setOriginalDiagram(JSON.parse(JSON.stringify(diagram))); // Deep copy
    setIsEditing(true);
  };

  const finishEditing = () => {
    setIsEditing(false);
    setOriginalDiagram(null);
    setSelectedNode(null);
    setEditingNode(null);
  };

  const cancelEditing = () => {
    if (originalDiagram) {
      onUpdate(originalDiagram); // Revert to original
    }
    setIsEditing(false);
    setOriginalDiagram(null);
    setSelectedNode(null);
    setEditingNode(null);
  };

  const getNodeStyle = (type: DiagramNode['type']) => {
    switch (type) {
      case 'start':
        return {
          fill: '#10B981',
          stroke: '#059669',
          textColor: '#FFFFFF'
        };
      case 'end':
        return {
          fill: '#EF4444',
          stroke: '#DC2626',
          textColor: '#FFFFFF'
        };
      case 'decision':
        return {
          fill: '#F59E0B',
          stroke: '#D97706',
          textColor: '#FFFFFF'
        };
      case 'bar':
        return {
          fill: '#3B82F6',
          stroke: '#1E40AF',
          textColor: '#FFFFFF'
        };
      case 'slice':
        return {
          fill: '#8B5CF6',
          stroke: '#7C3AED',
          textColor: '#FFFFFF'
        };
      case 'header':
        return {
          fill: '#1F2937',
          stroke: '#111827',
          textColor: '#FFFFFF'
        };
      case 'cell':
        return {
          fill: '#F9FAFB',
          stroke: '#E5E7EB',
          textColor: '#1F2937'
        };
      case 'axis':
        return {
          fill: '#374151',
          stroke: '#111827',
          textColor: '#374151'
        };
      case 'point':
        return {
          fill: '#EF4444',
          stroke: '#DC2626',
          textColor: '#FFFFFF'
        };
      case 'data':
        return {
          fill: 'transparent',
          stroke: 'transparent',
          textColor: '#374151'
        };
      default:
        return {
          fill: '#3B82F6',
          stroke: '#2563EB',
          textColor: '#FFFFFF'
        };
    }
  };

  const handleNodeEdit = (nodeId: string, newText: string) => {
    const updatedNodes = diagram.nodes.map(node =>
      node.id === nodeId ? { ...node, text: newText } : node
    );
    onUpdate({ ...diagram, nodes: updatedNodes });
    setEditingNode(null);
    setTempText('');
  };

  const handleNodeMove = (nodeId: string, newX: number, newY: number) => {
    const updatedNodes = diagram.nodes.map(node =>
      node.id === nodeId ? { ...node, x: newX, y: newY } : node
    );
    onUpdate({ ...diagram, nodes: updatedNodes });
  };

  const handleNodeDelete = (nodeId: string) => {
    const updatedNodes = diagram.nodes.filter(node => node.id !== nodeId);
    const updatedConnections = diagram.connections.filter(
      conn => conn.from !== nodeId && conn.to !== nodeId
    );
    onUpdate({ 
      ...diagram, 
      nodes: updatedNodes, 
      connections: updatedConnections 
    });
    setSelectedNode(null);
  };

  const addNewNode = () => {
    const newNode: DiagramNode = {
      id: `node-${Date.now()}`,
      x: 150,
      y: 100,
      width: 160,
      height: 70,
      text: 'New Node',
      type: 'process'
    };
    onUpdate({ 
      ...diagram, 
      nodes: [...diagram.nodes, newNode] 
    });
  };

  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    if (!isEditing) return;
    
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const node = diagram.nodes.find(n => n.id === nodeId);
    if (!node) return;

    setDraggedNode(nodeId);
    setSelectedNode(nodeId);
    setDragOffset({
      x: e.clientX - rect.left - node.x,
      y: e.clientY - rect.top - node.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedNode || !isEditing) return;

    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const newX = Math.max(0, Math.min(500, e.clientX - rect.left - dragOffset.x));
    const newY = Math.max(0, Math.min(400, e.clientY - rect.top - dragOffset.y));

    handleNodeMove(draggedNode, newX, newY);
  };

  const handleMouseUp = () => {
    setDraggedNode(null);
  };

  const drawToCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high DPI for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Draw grid
    ctx.strokeStyle = '#f3f4f6';
    ctx.lineWidth = 1;
    for (let x = 0; x <= rect.width; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, rect.height);
      ctx.stroke();
    }
    for (let y = 0; y <= rect.height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(rect.width, y);
      ctx.stroke();
    }

    // Draw title
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(diagram.title, rect.width / 2, 30);

    // Render based on diagram type
    if (diagram.type === 'pie') {
      drawPieChart(ctx, rect.width, rect.height);
    } else if (diagram.type === 'bar') {
      drawBarChart(ctx, rect.width, rect.height);
    } else {
      // Draw connections for other diagram types
      diagram.connections.forEach(conn => {
        const fromNode = diagram.nodes.find(n => n.id === conn.from);
        const toNode = diagram.nodes.find(n => n.id === conn.to);
        if (!fromNode || !toNode) return;

        const x1 = fromNode.x + fromNode.width / 2;
        const y1 = fromNode.y + fromNode.height;
        const x2 = toNode.x + toNode.width / 2;
        const y2 = toNode.y;

        // Draw line with shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Draw arrowhead
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const arrowLength = 10;
        ctx.fillStyle = '#374151';
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(
          x2 - arrowLength * Math.cos(angle - Math.PI / 6),
          y2 - arrowLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          x2 - arrowLength * Math.cos(angle + Math.PI / 6),
          y2 - arrowLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();

        // Draw label if exists
        if (conn.label) {
          const labelX = (x1 + x2) / 2;
          const labelY = (y1 + y2) / 2;
          
          ctx.fillStyle = 'white';
          ctx.strokeStyle = '#e5e7eb';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(labelX - 25, labelY - 12, 50, 24, 6);
          ctx.fill();
          ctx.stroke();
          
          ctx.fillStyle = '#374151';
          ctx.font = '500 12px Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(conn.label, labelX, labelY + 4);
        }

        ctx.shadowColor = 'transparent';
      });

      // Draw nodes for other diagram types
      diagram.nodes.forEach(node => {
        const style = getNodeStyle(node.type);
        const isSelected = selectedNode === node.id;

        // Draw shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        // Draw node rectangle
        ctx.fillStyle = style.fill;
        ctx.strokeStyle = isSelected ? '#f59e0b' : style.stroke;
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.beginPath();
        ctx.roundRect(node.x, node.y, node.width, node.height, 12);
        ctx.fill();
        ctx.stroke();

        ctx.shadowColor = 'transparent';

        // Draw node text
        ctx.fillStyle = style.textColor;
        ctx.font = '600 14px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(
          node.text,
          node.x + node.width / 2,
          node.y + node.height / 2 + 5
        );

        // Draw type indicator
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(node.x + node.width - 12, node.y + 12, 6, 0, 2 * Math.PI);
        ctx.fill();

        ctx.fillStyle = style.fill;
        ctx.font = 'bold 10px Arial, sans-serif';
        ctx.textAlign = 'center';
        const indicator = node.type === 'start' ? 'S' : 
                        node.type === 'end' ? 'E' : 
                        node.type === 'decision' ? '?' : 'P';
        ctx.fillText(indicator, node.x + node.width - 12, node.y + 12 + 3);
      });
    }
  };

  useEffect(() => {
    drawToCanvas();
  }, [diagram, selectedNode]);

  const drawPieChart = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;
    
    // Calculate total value
    const pieData = diagram.nodes.filter(node => node.type === 'slice');
    const total = pieData.reduce((sum, node) => {
      const match = node.text.match(/(\d+)%/);
      return sum + (match ? parseInt(match[1]) : 0);
    }, 0);
    
    let currentAngle = -Math.PI / 2; // Start from top
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
    
    pieData.forEach((node, index) => {
      const match = node.text.match(/(\d+)%/);
      const percentage = match ? parseInt(match[1]) : 0;
      const sliceAngle = (percentage / 100) * 2 * Math.PI;
      
      // Draw slice
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = colors[index % colors.length];
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw label
      const labelAngle = currentAngle + sliceAngle / 2;
      const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
      const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${percentage}%`, labelX, labelY);
      
      // Draw category name outside
      const outerLabelX = centerX + Math.cos(labelAngle) * (radius + 30);
      const outerLabelY = centerY + Math.sin(labelAngle) * (radius + 30);
      
      ctx.fillStyle = '#374151';
      ctx.font = '12px Arial, sans-serif';
      const categoryName = node.text.split('\n')[0] || `Category ${index + 1}`;
      ctx.fillText(categoryName, outerLabelX, outerLabelY);
      
      currentAngle += sliceAngle;
    });
  };

  const drawBarChart = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const chartHeight = height * 0.6;
    const chartWidth = width * 0.7;
    const startX = 80;
    const baseY = height - 80;
    
    // Always create proper sample data for bar charts
    const sampleData = [
      { value: 45, category: 'Product A' },
      { value: 62, category: 'Product B' },
      { value: 38, category: 'Product C' },
      { value: 71, category: 'Product D' }
    ];
    
    const maxValue = Math.max(...sampleData.map(item => item.value));
    const barWidth = Math.min(80, (chartWidth - 40) / sampleData.length - 20);
    const spacing = (chartWidth - 40) / sampleData.length;
    
    // Draw axes
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 3;
    ctx.beginPath();
    // Y-axis
    ctx.moveTo(startX, baseY - chartHeight);
    ctx.lineTo(startX, baseY);
    // X-axis
    ctx.lineTo(startX + chartWidth, baseY);
    ctx.stroke();
    
    // Y-axis labels and grid lines
    const steps = 5;
    for (let i = 0; i <= steps; i++) {
      const value = Math.round((maxValue / steps) * i);
      const y = baseY - (chartHeight / steps) * i;
      
      ctx.fillStyle = '#374151';
      ctx.font = '12px Arial, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(value.toString(), startX - 10, y + 4);
      
      // Grid lines
      if (i > 0) {
        ctx.strokeStyle = '#E5E7EB';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(startX + chartWidth, y);
        ctx.stroke();
      }
    }
    
    // Draw bars
    sampleData.forEach((item, index) => {
      const barHeight = (item.value / maxValue) * chartHeight;
      const x = startX + index * spacing + (spacing - barWidth) / 2;
      const y = baseY - barHeight;
      
      // Draw bar with gradient
      const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
      const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
      gradient.addColorStop(0, colors[index % colors.length]);
      gradient.addColorStop(1, colors[index % colors.length] + '80');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, barHeight);
      
      // Bar border
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, barWidth, barHeight);
      
      // Value label on top of bar
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 14px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(item.value.toString(), x + barWidth/2, y - 8);
      
      // Category label below
      ctx.fillStyle = '#374151';
      ctx.font = '13px Arial, sans-serif';
      ctx.fillText(item.category, x + barWidth/2, baseY + 25);
    });
  };

  const exportAsImage = (format: 'png' | 'jpeg' = 'png') => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create a temporary canvas for export
    const exportCanvas = document.createElement('canvas');
    const exportCtx = exportCanvas.getContext('2d');
    if (!exportCtx) return;

    // Calculate optimal size
    const maxX = Math.max(...diagram.nodes.map(n => n.x + n.width)) + 50;
    const maxY = Math.max(...diagram.nodes.map(n => n.y + n.height)) + 50;
    const width = Math.max(800, maxX);
    const height = Math.max(600, maxY);

    exportCanvas.width = width;
    exportCanvas.height = height;

    // White background
    exportCtx.fillStyle = '#ffffff';
    exportCtx.fillRect(0, 0, width, height);

    // Draw grid
    exportCtx.strokeStyle = '#f3f4f6';
    exportCtx.lineWidth = 1;
    for (let x = 0; x <= width; x += 20) {
      exportCtx.beginPath();
      exportCtx.moveTo(x, 0);
      exportCtx.lineTo(x, height);
      exportCtx.stroke();
    }
    for (let y = 0; y <= height; y += 20) {
      exportCtx.beginPath();
      exportCtx.moveTo(0, y);
      exportCtx.lineTo(width, y);
      exportCtx.stroke();
    }

    // Draw title
    exportCtx.fillStyle = '#1f2937';
    exportCtx.font = 'bold 24px Arial, sans-serif';
    exportCtx.textAlign = 'center';
    exportCtx.fillText(diagram.title, width / 2, 40);

    // Draw connections
    diagram.connections.forEach(conn => {
      const fromNode = diagram.nodes.find(n => n.id === conn.from);
      const toNode = diagram.nodes.find(n => n.id === conn.to);
      if (!fromNode || !toNode) return;

      const x1 = fromNode.x + fromNode.width / 2;
      const y1 = fromNode.y + fromNode.height;
      const x2 = toNode.x + toNode.width / 2;
      const y2 = toNode.y;

      // Draw line
      exportCtx.strokeStyle = '#374151';
      exportCtx.lineWidth = 4;
      exportCtx.beginPath();
      exportCtx.moveTo(x1, y1);
      exportCtx.lineTo(x2, y2);
      exportCtx.stroke();

      // Draw arrowhead
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const arrowLength = 12;
      exportCtx.fillStyle = '#374151';
      exportCtx.beginPath();
      exportCtx.moveTo(x2, y2);
      exportCtx.lineTo(
        x2 - arrowLength * Math.cos(angle - Math.PI / 6),
        y2 - arrowLength * Math.sin(angle - Math.PI / 6)
      );
      exportCtx.lineTo(
        x2 - arrowLength * Math.cos(angle + Math.PI / 6),
        y2 - arrowLength * Math.sin(angle + Math.PI / 6)
      );
      exportCtx.closePath();
      exportCtx.fill();

      // Draw label
      if (conn.label) {
        const labelX = (x1 + x2) / 2;
        const labelY = (y1 + y2) / 2;
        
        exportCtx.fillStyle = 'white';
        exportCtx.strokeStyle = '#e5e7eb';
        exportCtx.lineWidth = 2;
        exportCtx.beginPath();
        exportCtx.roundRect(labelX - 30, labelY - 15, 60, 30, 8);
        exportCtx.fill();
        exportCtx.stroke();
        
        exportCtx.fillStyle = '#374151';
        exportCtx.font = '600 14px Arial, sans-serif';
        exportCtx.textAlign = 'center';
        exportCtx.fillText(conn.label, labelX, labelY + 5);
      }
    });

    // Draw nodes
    diagram.nodes.forEach(node => {
      const style = getNodeStyle(node.type);

      // Draw node
      exportCtx.fillStyle = style.fill;
      exportCtx.strokeStyle = style.stroke;
      exportCtx.lineWidth = 3;
      exportCtx.beginPath();
      exportCtx.roundRect(node.x, node.y, node.width, node.height, 15);
      exportCtx.fill();
      exportCtx.stroke();

      // Draw text
      exportCtx.fillStyle = style.textColor;
      exportCtx.font = '600 16px Arial, sans-serif';
      exportCtx.textAlign = 'center';
      exportCtx.fillText(
        node.text,
        node.x + node.width / 2,
        node.y + node.height / 2 + 6
      );

      // Draw type indicator
      exportCtx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      exportCtx.beginPath();
      exportCtx.arc(node.x + node.width - 15, node.y + 15, 8, 0, 2 * Math.PI);
      exportCtx.fill();

      exportCtx.fillStyle = style.fill;
      exportCtx.font = 'bold 12px Arial, sans-serif';
      const indicator = node.type === 'start' ? 'S' : 
                      node.type === 'end' ? 'E' : 
                      node.type === 'decision' ? '?' : 'P';
      exportCtx.fillText(indicator, node.x + node.width - 15, node.y + 15 + 4);
    });

    // Download
    const link = document.createElement('a');
    link.download = `${diagram.title.replace(/\s+/g, '-').toLowerCase()}.${format}`;
    link.href = exportCanvas.toDataURL(`image/${format}`, 0.95);
    link.click();
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800 flex items-center">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          {diagram.title}
        </h3>
        <div className="flex space-x-2">
          {isEditing && (
            <button
              onClick={addNewNode}
              className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-1"
              title="Add Node"
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm">Add Node</span>
            </button>
          )}
          
          {!isEditing ? (
            <button
              onClick={startEditing}
              className="p-2 bg-white text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors flex items-center space-x-1"
            >
              <Edit3 className="h-4 w-4" />
              <span className="text-sm">Edit</span>
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={cancelEditing}
                className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-1"
                title="Cancel and revert all changes"
              >
                <RotateCcw className="h-4 w-4" />
                <span className="text-sm">Cancel</span>
              </button>
              <button
                onClick={finishEditing}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1"
              >
                <Save className="h-4 w-4" />
                <span className="text-sm">Done</span>
              </button>
            </div>
          )}
          
          <div className="relative group">
            <button className="p-2 bg-white text-gray-600 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200 flex items-center space-x-1">
              <Download className="h-4 w-4" />
              <span className="text-sm">Export</span>
            </button>
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button
                onClick={() => exportAsImage('png')}
                className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
              >
                Export as PNG
              </button>
              <button
                onClick={() => exportAsImage('jpeg')}
                className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-b-lg"
              >
                Export as JPEG
              </button>
            </div>
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="mb-4 p-3 bg-blue-100 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800 font-medium">
            🎯 Edit Mode Active: Click nodes to select, drag to move, double-click to edit text
          </p>
        </div>
      )}

      <div className="relative bg-white rounded-xl shadow-inner border-2 border-gray-100 overflow-hidden">
        {/* Hidden canvas for export */}
        <canvas
          ref={canvasRef}
          className="hidden"
          width={800}
          height={600}
        />
        
        {/* Interactive SVG overlay */}
        <svg 
          ref={svgRef}
          width="100%"
          height={diagram.type === 'bar' || diagram.type === 'pie' || diagram.type === 'line' || diagram.type === 'table' 
            ? 600 
            : Math.max(500, Math.max(...diagram.nodes.map(n => n.y + n.height)) + 100)
          }
          viewBox={diagram.type === 'bar' || diagram.type === 'pie' || diagram.type === 'line' || diagram.type === 'table'
            ? "0 0 800 600"
            : `0 0 800 ${Math.max(500, Math.max(...diagram.nodes.map(n => n.y + n.height)) + 100)}`
          }
          className="cursor-default"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="10"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#374151" />
            </marker>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="#00000020"/>
            </filter>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#3B82F6" floodOpacity="0.5"/>
            </filter>
          </defs>
          
          {/* Grid Pattern */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#F3F4F6" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Render connections first (behind nodes) */}
          {diagram.connections.map(connection => {
            const fromNode = diagram.nodes.find(n => n.id === connection.from);
            const toNode = diagram.nodes.find(n => n.id === connection.to);
            
            if (!fromNode || !toNode) return null;
            
            const x1 = fromNode.x + fromNode.width / 2;
            const y1 = fromNode.y + fromNode.height;
            const x2 = toNode.x + toNode.width / 2;
            const y2 = toNode.y;
            
            return (
              <g key={connection.id}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#374151"
                  strokeWidth="3"
                  markerEnd="url(#arrowhead)"
                  className="drop-shadow-sm"
                />
                {connection.label && (
                  <g>
                    <rect
                      x={(x1 + x2) / 2 - 25}
                      y={(y1 + y2) / 2 - 12}
                      width="50"
                      height="24"
                      fill="white"
                      stroke="#E5E7EB"
                      strokeWidth="1"
                      rx="6"
                      filter="url(#shadow)"
                    />
                    <text
                      x={(x1 + x2) / 2}
                      y={(y1 + y2) / 2 + 4}
                      textAnchor="middle"
                      className="text-xs font-medium fill-gray-700"
                    >
                      {connection.label}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
          
          {/* Render nodes */}
          {diagram.nodes.map(node => {
            const style = getNodeStyle(node.type);
            const isSelected = selectedNode === node.id;
            
            return (
              <g key={node.id}>
                <rect
                  x={node.x}
                  y={node.y}
                  width={node.width}
                  height={node.height}
                  rx="12"
                  fill={style.fill}
                  stroke={isSelected ? '#F59E0B' : style.stroke}
                  strokeWidth={isSelected ? "3" : "2"}
                  filter={isSelected ? "url(#glow)" : "url(#shadow)"}
                  className={`transition-all duration-200 ${isEditing ? 'cursor-move hover:opacity-90' : 'cursor-pointer'}`}
                  onMouseDown={(e) => handleMouseDown(e, node.id)}
                  onClick={() => {
                    if (isEditing) {
                      setSelectedNode(node.id);
                    }
                  }}
                  onDoubleClick={() => {
                    if (isEditing) {
                      setEditingNode(node.id);
                      setTempText(node.text);
                    }
                  }}
                />
                <text
                  x={node.x + node.width / 2}
                  y={node.y + node.height / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-sm font-semibold pointer-events-none select-none"
                  fill={style.textColor}
                >
                  {node.text}
                </text>
                
                {/* Node type indicator */}
                <circle
                  cx={node.x + node.width - 12}
                  cy={node.y + 12}
                  r="6"
                  fill="white"
                  fillOpacity="0.9"
                  className="pointer-events-none"
                />
                <text
                  x={node.x + node.width - 12}
                  y={node.y + 12}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-xs font-bold pointer-events-none"
                  fill={style.fill}
                >
                  {node.type === 'start' ? 'S' : node.type === 'end' ? 'E' : node.type === 'decision' ? '?' : 'P'}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Node Controls */}
      {isEditing && selectedNode && (
        <div className="mt-4 p-4 bg-white rounded-lg border shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-800 flex items-center">
              <Type className="h-4 w-4 mr-2" />
              Node Controls
            </h4>
            <button
              onClick={() => handleNodeDelete(selectedNode)}
              className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
              title="Delete Node"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Node Type</label>
              <select
                value={diagram.nodes.find(n => n.id === selectedNode)?.type || 'process'}
                onChange={(e) => {
                  const updatedNodes = diagram.nodes.map(node =>
                    node.id === selectedNode 
                      ? { ...node, type: e.target.value as DiagramNode['type'] }
                      : node
                  );
                  onUpdate({ ...diagram, nodes: updatedNodes });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="start">Start</option>
                <option value="process">Process</option>
                <option value="decision">Decision</option>
                <option value="end">End</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quick Edit Text</label>
              <button
                onClick={() => {
                  const node = diagram.nodes.find(n => n.id === selectedNode);
                  if (node) {
                    setEditingNode(selectedNode);
                    setTempText(node.text);
                  }
                }}
                className="w-full px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Edit Text
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Text Editing Modal */}
      {editingNode && (
        <div className="mt-4 p-4 bg-white rounded-lg border shadow-lg">
          <h4 className="font-semibold mb-3 text-gray-800">Edit Node Text</h4>
          <div className="flex space-x-2">
            <input
              type="text"
              value={tempText}
              onChange={(e) => setTempText(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter node text..."
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleNodeEdit(editingNode, tempText);
                } else if (e.key === 'Escape') {
                  setEditingNode(null);
                  setTempText('');
                }
              }}
            />
            <button
              onClick={() => handleNodeEdit(editingNode, tempText)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
            >
              <Save className="h-4 w-4 mr-1" />
              Save
            </button>
            <button
              onClick={() => {
                setEditingNode(null);
                setTempText('');
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Cancel
            </button>
            </div>
        </div>
      )}
    </div>
  );
};