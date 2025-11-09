/**
 * Dynamic Diagram Generation Service
 * Handles any type of chart, diagram, or visualization request
 */

import { DiagramData, DiagramNode, DiagramConnection } from '../types';

export interface DiagramRequest {
  type: string;
  title: string;
  data?: any[];
  categories?: string[];
  values?: number[];
  labels?: string[];
  content?: string;
  context?: string;
}

export class DynamicDiagramGenerator {
  
  /**
   * Main entry point for generating any type of diagram
   */
  static generateDiagram(request: DiagramRequest): DiagramData {
    const type = this.detectDiagramType(request.type);
    
    switch (type) {
      case 'bar':
        return this.generateBarChart(request);
      case 'pie':
        return this.generatePieChart(request);
      case 'line':
        return this.generateLineChart(request);
      case 'table':
        return this.generateTable(request);
      case 'flowchart':
        return this.generateFlowchart(request);
      case 'organizational':
        return this.generateOrgChart(request);
      case 'timeline':
        return this.generateTimeline(request);
      case 'process':
        return this.generateProcessDiagram(request);
      case 'mermaid':
        return this.generateMermaidDiagram(request);
      case 'network':
        return this.generateNetworkDiagram(request);
      case 'gantt':
        return this.generateGanttChart(request);
      case 'scatter':
        return this.generateScatterPlot(request);
      default:
        return this.generateGenericDiagram(request);
    }
  }

  /**
   * Detect diagram type from user request
   */
  private static detectDiagramType(input: string): string {
    const inputLower = input.toLowerCase();
    
    // Chart types
    if (inputLower.includes('bar chart') || inputLower.includes('bar graph') || inputLower.includes('column chart')) return 'bar';
    if (inputLower.includes('pie chart') || inputLower.includes('pie graph') || inputLower.includes('donut')) return 'pie';
    if (inputLower.includes('line chart') || inputLower.includes('line graph') || inputLower.includes('trend')) return 'line';
    if (inputLower.includes('scatter plot') || inputLower.includes('scatter chart') || inputLower.includes('xy chart')) return 'scatter';
    
    // Data formats
    if (inputLower.includes('table') || inputLower.includes('tabular') || inputLower.includes('grid')) return 'table';
    
    // Process diagrams
    if (inputLower.includes('flowchart') || inputLower.includes('flow chart') || inputLower.includes('decision tree')) return 'flowchart';
    if (inputLower.includes('process') || inputLower.includes('workflow') || inputLower.includes('procedure')) return 'process';
    if (inputLower.includes('timeline') || inputLower.includes('schedule') || inputLower.includes('roadmap')) return 'timeline';
    if (inputLower.includes('gantt') || inputLower.includes('project plan')) return 'gantt';
    
    // Organizational
    if (inputLower.includes('org chart') || inputLower.includes('organizational') || inputLower.includes('hierarchy')) return 'organizational';
    if (inputLower.includes('network') || inputLower.includes('relationship') || inputLower.includes('connection')) return 'network';
    
    // Technical
    if (inputLower.includes('mermaid') || inputLower.includes('sequence') || inputLower.includes('class diagram')) return 'mermaid';
    
    return 'flowchart'; // Default fallback
  }

  /**
   * Generate dynamic bar chart
   */
  private static generateBarChart(request: DiagramRequest): DiagramData {
    // For bar charts, we'll let the canvas rendering handle the visualization
    // This creates a simple marker that tells the renderer it's a bar chart
    const nodes: DiagramNode[] = [
      {
        id: 'bar-chart-marker',
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        text: 'Bar Chart Data',
        type: 'bar'
      }
    ];

    return {
      id: crypto.randomUUID(),
      type: 'bar',
      title: request.title || 'Dynamic Bar Chart',
      nodes,
      connections: []
    };
  }

  /**
   * Generate dynamic pie chart
   */
  private static generatePieChart(request: DiagramRequest): DiagramData {
    const data = this.generateContextualData(request, 'pie');
    const nodes: DiagramNode[] = [];

    // Create pie slice data nodes (these will be rendered as actual pie slices)
    data.categories.forEach((category, index) => {
      const value = data.values[index];
      const total = data.values.reduce((sum: number, val: number) => sum + val, 0);
      const percentage = Math.round((value / total) * 100);

      nodes.push({
        id: `slice-${index}`,
        x: 0, // Position will be calculated during rendering
        y: 0,
        width: 0,
        height: 0,
        text: `${category}\n${percentage.toFixed(1)}%`,
        type: 'slice'
      });
    });

    return {
      id: crypto.randomUUID(),
      type: 'pie',
      title: request.title || 'Dynamic Pie Chart',
      nodes,
      connections: []
    };
  }

  /**
   * Generate dynamic line chart
   */
  private static generateLineChart(request: DiagramRequest): DiagramData {
    const data = this.generateContextualData(request, 'line');
    const nodes: DiagramNode[] = [];
    const connections: DiagramConnection[] = [];
    const chartHeight = 250;
    const chartWidth = 350;
    const startX = 80;
    const baseY = 350;
    const maxValue = Math.max(...data.values);

    // Create axes
    nodes.push({
      id: 'y-axis',
      x: 40,
      y: 100,
      width: 3,
      height: chartHeight,
      text: '',
      type: 'axis'
    });
    
    nodes.push({
      id: 'x-axis',
      x: 40,
      y: baseY,
      width: chartWidth,
      height: 3,
      text: '',
      type: 'axis'
    });

    // Create data points and connections
    const pointSpacing = chartWidth / (data.values.length - 1);
    
    data.values.forEach((value, index) => {
      const x = startX + index * pointSpacing;
      const y = baseY - (value / maxValue) * chartHeight;

      nodes.push({
        id: `point-${index}`,
        x: x - 5,
        y: y - 5,
        width: 10,
        height: 10,
        text: value.toString(),
        type: 'point'
      });

      // Connect to previous point
      if (index > 0) {
        connections.push({
          id: `line-${index}`,
          from: `point-${index - 1}`,
          to: `point-${index}`,
          label: ''
        });
      }

      // X-axis labels
      nodes.push({
        id: `x-label-${index}`,
        x: x - 20,
        y: baseY + 10,
        width: 40,
        height: 20,
        text: data.categories[index] || `Point ${index + 1}`,
        type: 'data'
      });
    });

    return {
      id: crypto.randomUUID(),
      type: 'line',
      title: request.title || 'Dynamic Line Chart',
      nodes,
      connections
    };
  }

  /**
   * Generate dynamic table
   */
  private static generateTable(request: DiagramRequest): DiagramData {
    const data = this.generateContextualData(request, 'table');
    const nodes: DiagramNode[] = [];
    const cellWidth = 120;
    const cellHeight = 35;
    const startX = 50;
    const startY = 80;

    // Headers
    const headers = data.headers || ['Category', 'Value', 'Percentage'];
    headers.forEach((header, colIndex) => {
      nodes.push({
        id: `header-${colIndex}`,
        x: startX + colIndex * cellWidth,
        y: startY,
        width: cellWidth,
        height: cellHeight,
        text: header,
        type: 'header'
      });
    });

    // Data rows
    data.rows.forEach((row: any[], rowIndex: number) => {
      row.forEach((cell, colIndex) => {
        nodes.push({
          id: `cell-${rowIndex}-${colIndex}`,
          x: startX + colIndex * cellWidth,
          y: startY + (rowIndex + 1) * cellHeight,
          width: cellWidth,
          height: cellHeight,
          text: cell.toString(),
          type: 'cell'
        });
      });
    });

    return {
      id: crypto.randomUUID(),
      type: 'table',
      title: request.title || 'Dynamic Data Table',
      nodes,
      connections: []
    };
  }

  /**
   * Generate dynamic flowchart
   */
  private static generateFlowchart(request: DiagramRequest): DiagramData {
    const steps = this.generateContextualFlowchartSteps(request);
    const nodes: DiagramNode[] = [];
    const connections: DiagramConnection[] = [];
    const nodeWidth = 160;
    const nodeHeight = 70;
    const startX = 100;
    const startY = 50;
    const verticalSpacing = 120;

    steps.forEach((step, index) => {
      nodes.push({
        id: `step-${index}`,
        x: startX,
        y: startY + index * verticalSpacing,
        width: nodeWidth,
        height: nodeHeight,
        text: step.text,
        type: step.type
      });

      // Connect to next step
      if (index < steps.length - 1) {
        connections.push({
          id: `conn-${index}`,
          from: `step-${index}`,
          to: `step-${index + 1}`,
          label: step.label || ''
        });
      }
    });

    return {
      id: crypto.randomUUID(),
      type: 'flowchart',
      title: request.title || 'Dynamic Flowchart',
      nodes,
      connections
    };
  }

  /**
   * Generate organizational chart
   */
  private static generateOrgChart(request: DiagramRequest): DiagramData {
    const orgData = this.generateContextualOrgData(request);
    const nodes: DiagramNode[] = [];
    const connections: DiagramConnection[] = [];
    const nodeWidth = 140;
    const nodeHeight = 60;

    orgData.forEach((item, index) => {
      nodes.push({
        id: `org-${index}`,
        x: item.x,
        y: item.y,
        width: nodeWidth,
        height: nodeHeight,
        text: item.title,
        type: item.type
      });

      if (item.parentId !== undefined) {
        connections.push({
          id: `org-conn-${index}`,
          from: `org-${item.parentId}`,
          to: `org-${index}`,
          label: ''
        });
      }
    });

    return {
      id: crypto.randomUUID(),
      type: 'organizational',
      title: request.title || 'Dynamic Org Chart',
      nodes,
      connections
    };
  }

  /**
   * Generate timeline
   */
  private static generateTimeline(request: DiagramRequest): DiagramData {
    const timelineData = this.generateContextualTimelineData(request);
    const nodes: DiagramNode[] = [];
    const connections: DiagramConnection[] = [];
    const nodeWidth = 120;
    const nodeHeight = 60;
    const spacing = 150;
    const startX = 50;
    const y = 150;

    timelineData.forEach((item, index) => {
      nodes.push({
        id: `timeline-${index}`,
        x: startX + index * spacing,
        y: y,
        width: nodeWidth,
        height: nodeHeight,
        text: item.title,
        type: item.type
      });

      if (index < timelineData.length - 1) {
        connections.push({
          id: `timeline-conn-${index}`,
          from: `timeline-${index}`,
          to: `timeline-${index + 1}`,
          label: item.duration || ''
        });
      }
    });

    return {
      id: crypto.randomUUID(),
      type: 'timeline',
      title: request.title || 'Dynamic Timeline',
      nodes,
      connections
    };
  }

  /**
   * Generate process diagram
   */
  private static generateProcessDiagram(request: DiagramRequest): DiagramData {
    const processSteps = this.generateContextualProcessSteps(request);
    const nodes: DiagramNode[] = [];
    const connections: DiagramConnection[] = [];
    const nodeWidth = 140;
    const nodeHeight = 70;
    const startX = 100;
    const startY = 80;
    const verticalSpacing = 100;

    processSteps.forEach((step, index) => {
      nodes.push({
        id: `process-${index}`,
        x: startX,
        y: startY + index * verticalSpacing,
        width: nodeWidth,
        height: nodeHeight,
        text: step.text,
        type: 'process'
      });

      if (index < processSteps.length - 1) {
        connections.push({
          id: `process-conn-${index}`,
          from: `process-${index}`,
          to: `process-${index + 1}`,
          label: ''
        });
      }
    });

    return {
      id: crypto.randomUUID(),
      type: 'process',
      title: request.title || 'Dynamic Process',
      nodes,
      connections
    };
  }

  /**
   * Generate mermaid-style diagram
   */
  private static generateMermaidDiagram(request: DiagramRequest): DiagramData {
    // For now, create a flowchart-style mermaid diagram
    return this.generateFlowchart({
      ...request,
      title: request.title || 'Mermaid Diagram'
    });
  }

  /**
   * Generate network diagram
   */
  private static generateNetworkDiagram(request: DiagramRequest): DiagramData {
    const networkData = this.generateContextualNetworkData(request);
    const nodes: DiagramNode[] = [];
    const connections: DiagramConnection[] = [];

    networkData.nodes.forEach((node, index) => {
      nodes.push({
        id: `network-${index}`,
        x: node.x,
        y: node.y,
        width: 100,
        height: 60,
        text: node.label,
        type: 'process'
      });
    });

    networkData.connections.forEach((conn, index) => {
      connections.push({
        id: `network-conn-${index}`,
        from: `network-${conn.from}`,
        to: `network-${conn.to}`,
        label: conn.label || ''
      });
    });

    return {
      id: crypto.randomUUID(),
      type: 'network',
      title: request.title || 'Network Diagram',
      nodes,
      connections
    };
  }

  /**
   * Generate Gantt chart
   */
  private static generateGanttChart(request: DiagramRequest): DiagramData {
    const ganttData = this.generateContextualGanttData(request);
    const nodes: DiagramNode[] = [];
    const taskHeight = 40;
    const startX = 150;
    const startY = 80;

    ganttData.forEach((task, index) => {
      // Task name
      nodes.push({
        id: `task-name-${index}`,
        x: 20,
        y: startY + index * taskHeight,
        width: 120,
        height: taskHeight - 5,
        text: task.name,
        type: 'cell'
      });

      // Task bar
      nodes.push({
        id: `task-bar-${index}`,
        x: startX + task.start * 30,
        y: startY + index * taskHeight,
        width: task.duration * 30,
        height: taskHeight - 5,
        text: `${task.duration}d`,
        type: 'bar'
      });
    });

    return {
      id: crypto.randomUUID(),
      type: 'gantt',
      title: request.title || 'Gantt Chart',
      nodes,
      connections: []
    };
  }

  /**
   * Generate scatter plot
   */
  private static generateScatterPlot(request: DiagramRequest): DiagramData {
    const data = this.generateContextualScatterData(request);
    const nodes: DiagramNode[] = [];
    const chartHeight = 250;
    const chartWidth = 300;
    const startX = 80;
    const baseY = 350;

    // Create axes
    nodes.push({
      id: 'y-axis',
      x: 40,
      y: 100,
      width: 3,
      height: chartHeight,
      text: '',
      type: 'axis'
    });
    
    nodes.push({
      id: 'x-axis',
      x: 40,
      y: baseY,
      width: chartWidth,
      height: 3,
      text: '',
      type: 'axis'
    });

    // Create scatter points
    data.points.forEach((point, index) => {
      const x = startX + (point.x / 100) * chartWidth;
      const y = baseY - (point.y / 100) * chartHeight;

      nodes.push({
        id: `scatter-${index}`,
        x: x - 4,
        y: y - 4,
        width: 8,
        height: 8,
        text: `(${point.x},${point.y})`,
        type: 'point'
      });
    });

    return {
      id: crypto.randomUUID(),
      type: 'scatter',
      title: request.title || 'Scatter Plot',
      nodes,
      connections: []
    };
  }

  /**
   * Generate generic diagram
   */
  private static generateGenericDiagram(request: DiagramRequest): DiagramData {
    return this.generateFlowchart(request);
  }

  // Helper methods for generating contextual data

  private static generateContextualData(request: DiagramRequest, type: string): any {
    if (request.data && request.data.length > 0) {
      return this.processUserData(request.data, type);
    }

    // Generate intelligent contextual data based on request content
    const context = request.content || request.context || '';
    
    switch (type) {
      case 'bar':
      case 'pie':
      case 'line':
        return this.generateContextualChartData(context, type);
      case 'table':
        return this.generateContextualTableData(context);
      default:
        return this.generateGenericData(context, type);
    }
  }

  private static generateContextualChartData(context: string, type: string): any {
    const contextLower = context.toLowerCase();
    
    // Dynamic keyword detection
    const businessKeywords = ['sales', 'revenue', 'profit', 'customers', 'products', 'regions', 'quarters', 'marketing', 'finance'];
    const techKeywords = ['performance', 'usage', 'errors', 'response time', 'throughput', 'memory', 'cpu', 'network', 'database'];
    const projectKeywords = ['tasks', 'milestones', 'phases', 'sprints', 'features', 'bugs', 'issues', 'progress'];
    const demographicKeywords = ['age', 'gender', 'location', 'education', 'income', 'occupation'];
    const timeKeywords = ['monthly', 'quarterly', 'yearly', 'daily', 'weekly', 'hourly'];

    let categories: string[];
    let values: number[];
    
    // Dynamic data generation based on context analysis
    const isBusiness = businessKeywords.some(keyword => contextLower.includes(keyword));
    const isTech = techKeywords.some(keyword => contextLower.includes(keyword));
    const isProject = projectKeywords.some(keyword => contextLower.includes(keyword));
    const isDemographic = demographicKeywords.some(keyword => contextLower.includes(keyword));
    const isTime = timeKeywords.some(keyword => contextLower.includes(keyword));
    
    // Extract numbers from context if available
    const numbersInContext = context.match(/\d+/g)?.map(n => parseInt(n)).filter(n => n > 0 && n < 10000) || [];
    
    // Generate contextually appropriate categories and values
    if (isBusiness) {
      categories = this.generateBusinessCategories(contextLower);
      values = this.generateRealisticValues(categories.length, 'business', numbersInContext);
    } else if (isTech) {
      categories = this.generateTechCategories(contextLower);
      values = this.generateRealisticValues(categories.length, 'tech', numbersInContext);
    } else if (isProject) {
      categories = this.generateProjectCategories(contextLower);
      values = this.generateRealisticValues(categories.length, 'project', numbersInContext);
    } else if (isDemographic) {
      categories = this.generateDemographicCategories(contextLower);
      values = this.generateRealisticValues(categories.length, 'demographic', numbersInContext);
    } else if (isTime) {
      categories = this.generateTimeCategories(contextLower);
      values = this.generateRealisticValues(categories.length, 'time', numbersInContext);
    } else {
      // Generic categories based on context length and content
      const wordCount = context.split(' ').length;
      const categoryCount = Math.min(Math.max(3, Math.floor(wordCount / 10)), 8);
      categories = this.generateGenericCategories(categoryCount, contextLower);
      values = this.generateRealisticValues(categoryCount, 'generic', numbersInContext);
    }

    return { categories, values };
  }
  
  private static generateBusinessCategories(context: string): string[] {
    const businessCats = [
      ['Q1', 'Q2', 'Q3', 'Q4'],
      ['Sales', 'Marketing', 'Support', 'Operations'],
      ['North', 'South', 'East', 'West'],
      ['Product A', 'Product B', 'Product C', 'Product D'],
      ['Revenue', 'Costs', 'Profit', 'Investment']
    ];
    
    if (context.includes('quarter')) return businessCats[0];
    if (context.includes('department')) return businessCats[1];
    if (context.includes('region')) return businessCats[2];
    if (context.includes('product')) return businessCats[3];
    return businessCats[4];
  }
  
  private static generateTechCategories(context: string): string[] {
    const techCats = [
      ['CPU', 'Memory', 'Disk', 'Network'],
      ['Frontend', 'Backend', 'Database', 'Cache'],
      ['Mobile', 'Web', 'API', 'Desktop'],
      ['Development', 'Testing', 'Production', 'Staging']
    ];
    
    if (context.includes('resource') || context.includes('usage')) return techCats[0];
    if (context.includes('system') || context.includes('architecture')) return techCats[1];
    if (context.includes('platform')) return techCats[2];
    return techCats[3];
  }
  
  private static generateProjectCategories(context: string): string[] {
    const projectCats = [
      ['Planning', 'Development', 'Testing', 'Deployment'],
      ['Sprint 1', 'Sprint 2', 'Sprint 3', 'Sprint 4'],
      ['Features', 'Bugs', 'Tasks', 'Reviews'],
      ['Team A', 'Team B', 'Team C', 'Team D']
    ];
    
    if (context.includes('phase') || context.includes('stage')) return projectCats[0];
    if (context.includes('sprint') || context.includes('agile')) return projectCats[1];
    if (context.includes('work') || context.includes('item')) return projectCats[2];
    return projectCats[3];
  }
  
  private static generateDemographicCategories(context: string): string[] {
    const demoCats = [
      ['18-25', '26-35', '36-45', '46+'],
      ['Male', 'Female', 'Other', 'Prefer not to say'],
      ['Urban', 'Suburban', 'Rural', 'Metropolitan'],
      ['High School', 'Bachelor', 'Master', 'PhD']
    ];
    
    if (context.includes('age')) return demoCats[0];
    if (context.includes('gender')) return demoCats[1];
    if (context.includes('location')) return demoCats[2];
    return demoCats[3];
  }
  
  private static generateTimeCategories(context: string): string[] {
    if (context.includes('month')) return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    if (context.includes('quarter')) return ['Q1', 'Q2', 'Q3', 'Q4'];
    if (context.includes('day')) return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    if (context.includes('week')) return ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    return ['2021', '2022', '2023', '2024'];
  }
  
  private static generateGenericCategories(count: number, context: string): string[] {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const categories = [];
    
    for (let i = 0; i < count; i++) {
      if (context.includes('item')) {
        categories.push(`Item ${letters[i]}`);
      } else if (context.includes('category')) {
        categories.push(`Category ${letters[i]}`);
      } else if (context.includes('group')) {
        categories.push(`Group ${letters[i]}`);
      } else {
        categories.push(`Option ${letters[i]}`);
      }
    }
    
    return categories;
  }
  
  private static generateRealisticValues(count: number, type: string, contextNumbers: number[]): number[] {
    const values = [];
    
    // Use context numbers if available
    if (contextNumbers.length >= count) {
      return contextNumbers.slice(0, count);
    }
    
    // Generate realistic ranges based on type
    let min: number, max: number;
    
    switch (type) {
      case 'business':
        min = 10000; max = 100000;
        break;
      case 'tech':
        min = 10; max = 100;
        break;
      case 'project':
        min = 5; max = 50;
        break;
      case 'demographic':
        min = 100; max = 1000;
        break;
      case 'time':
        min = 50; max = 500;
        break;
      default:
        min = 10; max = 100;
    }
    
    for (let i = 0; i < count; i++) {
      values.push(Math.floor(Math.random() * (max - min + 1)) + min);
    }

    return values;
  }

  private static generateContextualTableData(context: string): any {
    const contextLower = context.toLowerCase();
    
    let headers: string[];
    let rows: string[][];
    
    // Dynamic table structure based on context
    if (contextLower.includes('sales') || contextLower.includes('revenue')) {
      headers = ['Product', 'Sales', 'Revenue', 'Growth'];
      rows = this.generateSalesTableRows();
    } else if (contextLower.includes('employee') || contextLower.includes('staff')) {
      headers = ['Name', 'Department', 'Role', 'Experience'];
      rows = this.generateEmployeeTableRows();
    } else if (contextLower.includes('project') || contextLower.includes('task')) {
      headers = ['Task', 'Status', 'Assignee', 'Due Date'];
      rows = this.generateProjectTableRows();
    } else if (contextLower.includes('performance') || contextLower.includes('metric')) {
      headers = ['Metric', 'Current', 'Target', 'Status'];
      rows = this.generatePerformanceTableRows();
    } else {
      // Generic table based on context
      headers = ['Item', 'Value', 'Category', 'Status'];
      rows = this.generateGenericTableRows();
    }

    return { headers, rows };
  }
  
  private static generateSalesTableRows(): string[][] {
    return [
      ['Product Alpha', '1,250', '$125,000', '+15%'],
      ['Product Beta', '2,100', '$210,000', '+8%'],
      ['Product Gamma', '850', '$85,000', '-3%'],
      ['Product Delta', '1,750', '$175,000', '+22%']
    ];
  }
  
  private static generateEmployeeTableRows(): string[][] {
    return [
      ['John Smith', 'Engineering', 'Senior Dev', '5 years'],
      ['Sarah Johnson', 'Marketing', 'Manager', '3 years'],
      ['Mike Chen', 'Sales', 'Rep', '2 years'],
      ['Lisa Brown', 'HR', 'Specialist', '4 years']
    ];
  }
  
  private static generateProjectTableRows(): string[][] {
    return [
      ['UI Design', 'In Progress', 'Alice', '2024-02-15'],
      ['Backend API', 'Complete', 'Bob', '2024-02-10'],
      ['Testing', 'Pending', 'Carol', '2024-02-20'],
      ['Deployment', 'Not Started', 'Dave', '2024-02-25']
    ];
  }
  
  private static generatePerformanceTableRows(): string[][] {
    return [
      ['Response Time', '250ms', '200ms', 'Warning'],
      ['Uptime', '99.8%', '99.9%', 'Good'],
      ['Error Rate', '0.1%', '0.05%', 'Warning'],
      ['Throughput', '1000 req/s', '1200 req/s', 'Good']
    ];
  }
  
  private static generateGenericTableRows(): string[][] {
    return [
      ['Item Alpha', '125', 'Type A', 'Active'],
      ['Item Beta', '210', 'Type B', 'Active'],
      ['Item Gamma', '85', 'Type A', 'Inactive'],
      ['Item Delta', '175', 'Type C', 'Pending']
    ];
  }

  private static generateGenericData(context: string, type: string): any {
    const wordCount = context.split(' ').length;
    const itemCount = Math.min(Math.max(3, Math.floor(wordCount / 5)), 6);
    
    return {
      categories: Array.from({length: itemCount}, (_, i) => `Item ${String.fromCharCode(65 + i)}`),
      values: Array.from({length: itemCount}, () => Math.floor(Math.random() * 100) + 10)
    };
  }

  private static processUserData(data: any[], type: string): any {
    // Process user-provided data into the format needed for the diagram type
    return {
      categories: data.map((item, index) => item.name || item.label || `Item ${index + 1}`),
      values: data.map(item => item.value || item.count || Math.random() * 100)
    };
  }

  private static generateContextualFlowchartSteps(request: DiagramRequest): any[] {
    const context = request.content || request.context || '';
    const contextLower = context.toLowerCase();

    // Check for travel/flight/ticket content
    if (contextLower.includes('flight') || contextLower.includes('ticket') ||
        contextLower.includes('booking') || contextLower.includes('travel') ||
        contextLower.includes('passenger') || contextLower.includes('airport')) {
      return this.generateTravelFlowchart(context);
    }

    // Dynamic flowchart generation based on context
    if (contextLower.includes('approval') || contextLower.includes('review')) {
      return this.generateApprovalFlowchart(contextLower);
    } else if (contextLower.includes('order') || contextLower.includes('purchase')) {
      return this.generateOrderFlowchart(contextLower);
    } else if (contextLower.includes('login') || contextLower.includes('authentication')) {
      return this.generateAuthFlowchart(contextLower);
    } else if (contextLower.includes('payment') || contextLower.includes('transaction')) {
      return this.generatePaymentFlowchart(contextLower);
    } else if (contextLower.includes('support') || contextLower.includes('ticket')) {
      return this.generateSupportFlowchart(contextLower);
    } else {
      return this.generateGenericFlowchart(contextLower);
    }
  }
  
  private static generateTravelFlowchart(context: string): any[] {
    // Extract actual information from context
    const hasPassenger = context.includes('Mrs') || context.includes('Mr');
    const hasBooking = /booking reference|booking ref/i.test(context);
    const hasFlight = /flight number|flight/i.test(context);
    const hasDeparture = /departure|depart/i.test(context);
    const hasArrival = /arrival|arrive/i.test(context);
    const hasBaggage = /baggage|luggage/i.test(context);
    const hasPayment = /payment|fare|total|cost/i.test(context);

    return [
      { text: 'Booking Initiated', type: 'start' },
      { text: hasBooking ? 'Booking Confirmed\n(Reference Created)' : 'Create Booking', type: 'process' },
      { text: hasPassenger ? 'Passenger Details\nVerified' : 'Enter Passenger Info', type: 'process' },
      { text: hasFlight ? 'Flight Selection\n& Seat Assignment' : 'Select Flight', type: 'process' },
      { text: hasBaggage ? 'Baggage Allowance\nConfirmed' : 'Check Baggage', type: 'process' },
      { text: hasPayment ? 'Payment Processed\n& Ticket Issued' : 'Process Payment', type: 'process' },
      { text: hasDeparture && hasArrival ? 'Travel Journey\nReady' : 'Booking Complete', type: 'end' }
    ];
  }

  private static generateApprovalFlowchart(context: string): any[] {
    return [
      { text: 'Start Request', type: 'start' },
      { text: 'Submit Application', type: 'process' },
      { text: 'Initial Review', type: 'process' },
      { text: 'Meets Criteria?', type: 'decision' },
      { text: 'Manager Approval', type: 'process', label: 'Yes' },
      { text: 'Request Approved', type: 'end' },
      { text: 'Request Rejected', type: 'end', label: 'No' }
    ];
  }
  
  private static generateOrderFlowchart(context: string): any[] {
    return [
      { text: 'Customer Order', type: 'start' },
      { text: 'Check Inventory', type: 'process' },
      { text: 'Items Available?', type: 'decision' },
      { text: 'Process Payment', type: 'process', label: 'Yes' },
      { text: 'Ship Order', type: 'process' },
      { text: 'Order Complete', type: 'end' },
      { text: 'Backorder', type: 'process', label: 'No' }
    ];
  }
  
  private static generateAuthFlowchart(context: string): any[] {
    return [
      { text: 'User Login', type: 'start' },
      { text: 'Enter Credentials', type: 'process' },
      { text: 'Valid Credentials?', type: 'decision' },
      { text: 'Grant Access', type: 'process', label: 'Yes' },
      { text: 'Login Successful', type: 'end' },
      { text: 'Show Error', type: 'process', label: 'No' },
      { text: 'Login Failed', type: 'end' }
    ];
  }
  
  private static generatePaymentFlowchart(context: string): any[] {
    return [
      { text: 'Initiate Payment', type: 'start' },
      { text: 'Validate Card', type: 'process' },
      { text: 'Card Valid?', type: 'decision' },
      { text: 'Process Transaction', type: 'process', label: 'Yes' },
      { text: 'Payment Success', type: 'end' },
      { text: 'Payment Failed', type: 'end', label: 'No' }
    ];
  }
  
  private static generateSupportFlowchart(context: string): any[] {
    return [
      { text: 'Customer Issue', type: 'start' },
      { text: 'Create Ticket', type: 'process' },
      { text: 'Assign Agent', type: 'process' },
      { text: 'Issue Resolved?', type: 'decision' },
      { text: 'Close Ticket', type: 'process', label: 'Yes' },
      { text: 'Escalate', type: 'process', label: 'No' },
      { text: 'Resolution Complete', type: 'end' }
    ];
  }
  
  private static generateGenericFlowchart(context: string): any[] {
    const steps = [];
    const words = context.split(' ').filter(w => w.length > 3);
    const stepCount = Math.min(Math.max(4, Math.floor(words.length / 3)), 8);
    
    steps.push({ text: 'Start Process', type: 'start' });
    
    for (let i = 1; i < stepCount - 1; i++) {
      if (i === Math.floor(stepCount / 2)) {
        steps.push({ text: 'Decision Point?', type: 'decision' });
      } else {
        steps.push({ text: `Step ${i}`, type: 'process' });
      }
    }
    
    steps.push({ text: 'Complete', type: 'end' });
    return steps;
  }

  private static generateContextualOrgData(request: DiagramRequest): any[] {
    const context = request.content || request.context || '';
    const contextLower = context.toLowerCase();
    
    if (contextLower.includes('tech') || contextLower.includes('engineering')) {
      return this.generateTechOrgChart();
    } else if (contextLower.includes('sales') || contextLower.includes('marketing')) {
      return this.generateSalesOrgChart();
    } else if (contextLower.includes('hospital') || contextLower.includes('medical')) {
      return this.generateMedicalOrgChart();
    } else {
      return this.generateGenericOrgChart();
    }
  }
  
  private static generateTechOrgChart(): any[] {
    return [
      { title: 'CTO', type: 'executive', x: 200, y: 50 },
      { title: 'Engineering Manager', type: 'manager', x: 100, y: 150, parentId: 0 },
      { title: 'Product Manager', type: 'manager', x: 300, y: 150, parentId: 0 },
      { title: 'Frontend Team', type: 'employee', x: 50, y: 250, parentId: 1 },
      { title: 'Backend Team', type: 'employee', x: 150, y: 250, parentId: 1 },
      { title: 'QA Team', type: 'employee', x: 250, y: 250, parentId: 2 },
      { title: 'DevOps Team', type: 'employee', x: 350, y: 250, parentId: 2 }
    ];
  }
  
  private static generateSalesOrgChart(): any[] {
    return [
      { title: 'VP Sales', type: 'executive', x: 200, y: 50 },
      { title: 'Sales Manager', type: 'manager', x: 100, y: 150, parentId: 0 },
      { title: 'Marketing Manager', type: 'manager', x: 300, y: 150, parentId: 0 },
      { title: 'Inside Sales', type: 'employee', x: 50, y: 250, parentId: 1 },
      { title: 'Field Sales', type: 'employee', x: 150, y: 250, parentId: 1 },
      { title: 'Digital Marketing', type: 'employee', x: 250, y: 250, parentId: 2 },
      { title: 'Content Team', type: 'employee', x: 350, y: 250, parentId: 2 }
    ];
  }
  
  private static generateMedicalOrgChart(): any[] {
    return [
      { title: 'Chief Medical Officer', type: 'executive', x: 200, y: 50 },
      { title: 'Department Head', type: 'manager', x: 100, y: 150, parentId: 0 },
      { title: 'Nursing Manager', type: 'manager', x: 300, y: 150, parentId: 0 },
      { title: 'Physicians', type: 'employee', x: 50, y: 250, parentId: 1 },
      { title: 'Specialists', type: 'employee', x: 150, y: 250, parentId: 1 },
      { title: 'Registered Nurses', type: 'employee', x: 250, y: 250, parentId: 2 },
      { title: 'Support Staff', type: 'employee', x: 350, y: 250, parentId: 2 }
    ];
  }
  
  private static generateGenericOrgChart(): any[] {
    return [
      { title: 'Executive', type: 'executive', x: 200, y: 50 },
      { title: 'Manager A', type: 'manager', x: 100, y: 150, parentId: 0 },
      { title: 'Manager B', type: 'manager', x: 300, y: 150, parentId: 0 },
      { title: 'Team Alpha', type: 'employee', x: 50, y: 250, parentId: 1 },
      { title: 'Team Beta', type: 'employee', x: 150, y: 250, parentId: 1 },
      { title: 'Team Gamma', type: 'employee', x: 250, y: 250, parentId: 2 },
      { title: 'Team Delta', type: 'employee', x: 350, y: 250, parentId: 2 }
    ];
  }

  private static generateContextualTimelineData(request: DiagramRequest): any[] {
    const context = request.content || request.context || '';
    const contextLower = context.toLowerCase();
    
    if (contextLower.includes('project') || contextLower.includes('development')) {
      return this.generateProjectTimeline();
    } else if (contextLower.includes('product') || contextLower.includes('launch')) {
      return this.generateProductTimeline();
    } else if (contextLower.includes('marketing') || contextLower.includes('campaign')) {
      return this.generateMarketingTimeline();
    } else {
      return this.generateGenericTimeline();
    }
  }
  
  private static generateProjectTimeline(): any[] {
    return [
      { title: 'Planning', type: 'milestone', duration: '2 weeks' },
      { title: 'Development', type: 'milestone', duration: '6 weeks' },
      { title: 'Testing', type: 'milestone', duration: '2 weeks' },
      { title: 'Deployment', type: 'deliverable', duration: '1 week' }
    ];
  }
  
  private static generateProductTimeline(): any[] {
    return [
      { title: 'Research', type: 'milestone', duration: '4 weeks' },
      { title: 'Design', type: 'milestone', duration: '3 weeks' },
      { title: 'Prototype', type: 'milestone', duration: '2 weeks' },
      { title: 'Launch', type: 'deliverable', duration: '1 week' }
    ];
  }
  
  private static generateMarketingTimeline(): any[] {
    return [
      { title: 'Strategy', type: 'milestone', duration: '1 week' },
      { title: 'Content Creation', type: 'milestone', duration: '3 weeks' },
      { title: 'Campaign Launch', type: 'milestone', duration: '1 week' },
      { title: 'Analysis', type: 'deliverable', duration: '2 weeks' }
    ];
  }
  
  private static generateGenericTimeline(): any[] {
    return [
      { title: 'Phase 1', type: 'milestone', duration: '2 weeks' },
      { title: 'Phase 2', type: 'milestone', duration: '3 weeks' },
      { title: 'Phase 3', type: 'milestone', duration: '2 weeks' },
      { title: 'Completion', type: 'deliverable', duration: '1 week' }
    ];
  }

  private static generateContextualProcessSteps(request: DiagramRequest): any[] {
    const context = request.content || request.context || '';
    const contextLower = context.toLowerCase();
    
    if (contextLower.includes('data') || contextLower.includes('processing')) {
      return [
        { text: 'Collect Data' },
        { text: 'Clean Data' },
        { text: 'Process Data' },
        { text: 'Analyze Results' },
        { text: 'Generate Report' }
      ];
    } else if (contextLower.includes('manufacturing') || contextLower.includes('production')) {
      return [
        { text: 'Raw Materials' },
        { text: 'Assembly' },
        { text: 'Quality Check' },
        { text: 'Packaging' },
        { text: 'Shipping' }
      ];
    } else {
      const words = context.split(' ').filter(w => w.length > 3);
      const stepCount = Math.min(Math.max(3, Math.floor(words.length / 4)), 7);
      
      const steps = [];
      for (let i = 0; i < stepCount; i++) {
        steps.push({ text: `Process Step ${i + 1}` });
      }
      return steps;
    }
  }

  private static generateContextualNetworkData(request: DiagramRequest): any {
    const context = request.content || request.context || '';
    const contextLower = context.toLowerCase();
    
    if (contextLower.includes('web') || contextLower.includes('application')) {
      return {
        nodes: [
          { label: 'Load Balancer', x: 200, y: 50 },
          { label: 'Web Server 1', x: 100, y: 150 },
          { label: 'Web Server 2', x: 300, y: 150 },
          { label: 'Database', x: 200, y: 250 }
        ],
        connections: [
          { from: 0, to: 1, label: 'Route' },
          { from: 0, to: 2, label: 'Route' },
          { from: 1, to: 3, label: 'Query' },
          { from: 2, to: 3, label: 'Query' }
        ]
      };
    } else if (contextLower.includes('office') || contextLower.includes('corporate')) {
      return {
        nodes: [
          { label: 'Router', x: 200, y: 50 },
          { label: 'Switch A', x: 100, y: 150 },
          { label: 'Switch B', x: 300, y: 150 },
          { label: 'Workstations', x: 200, y: 250 }
        ],
        connections: [
          { from: 0, to: 1, label: 'Connect' },
          { from: 0, to: 2, label: 'Connect' },
          { from: 1, to: 3, label: 'Access' },
          { from: 2, to: 3, label: 'Access' }
        ]
      };
    } else {
      return {
        nodes: [
          { label: 'Node A', x: 100, y: 100 },
          { label: 'Node B', x: 300, y: 100 },
          { label: 'Node C', x: 200, y: 200 },
          { label: 'Node D', x: 200, y: 50 }
        ],
        connections: [
          { from: 0, to: 2, label: 'Link' },
          { from: 1, to: 2, label: 'Link' },
          { from: 3, to: 0, label: 'Link' },
          { from: 3, to: 1, label: 'Link' }
        ]
      };
    }
  }

  private static generateContextualGanttData(request: DiagramRequest): any[] {
    const context = request.content || request.context || '';
    const contextLower = context.toLowerCase();
    
    if (contextLower.includes('software') || contextLower.includes('development')) {
      return [
        { name: 'Requirements', start: 0, duration: 3 },
        { name: 'Design', start: 2, duration: 4 },
        { name: 'Development', start: 5, duration: 8 },
        { name: 'Testing', start: 11, duration: 4 },
        { name: 'Deployment', start: 14, duration: 2 }
      ];
    } else if (contextLower.includes('construction') || contextLower.includes('building')) {
      return [
        { name: 'Foundation', start: 0, duration: 6 },
        { name: 'Framing', start: 5, duration: 8 },
        { name: 'Electrical', start: 10, duration: 5 },
        { name: 'Finishing', start: 13, duration: 7 }
      ];
    } else if (contextLower.includes('marketing') || contextLower.includes('campaign')) {
      return [
        { name: 'Research', start: 0, duration: 2 },
        { name: 'Strategy', start: 1, duration: 3 },
        { name: 'Content Creation', start: 3, duration: 5 },
        { name: 'Launch', start: 7, duration: 2 },
        { name: 'Analysis', start: 8, duration: 3 }
      ];
    } else {
      const words = context.split(' ').filter(w => w.length > 3);
      const taskCount = Math.min(Math.max(3, Math.floor(words.length / 5)), 6);
      
      const tasks = [];
      let currentStart = 0;
      
      for (let i = 0; i < taskCount; i++) {
        const duration = Math.floor(Math.random() * 5) + 2;
        const overlap = i > 0 ? Math.floor(Math.random() * 2) : 0;
        
        tasks.push({
          name: `Task ${String.fromCharCode(65 + i)}`,
          start: Math.max(0, currentStart - overlap),
          duration: duration
        });
        
        currentStart += duration - overlap;
      }
      
      return tasks;
    }
  }

  private static generateContextualScatterData(request: DiagramRequest): any {
    const context = request.content || request.context || '';
    const contextLower = context.toLowerCase();
    
    const points = [];
    const pointCount = Math.min(Math.max(10, Math.floor(context.length / 10)), 30);
    
    // Generate contextually relevant scatter data
    if (contextLower.includes('correlation') || contextLower.includes('relationship')) {
      // Generate correlated data
      for (let i = 0; i < pointCount; i++) {
        const x = Math.random() * 100;
        const y = x * 0.8 + Math.random() * 20; // Positive correlation with noise
        points.push({ x: Math.round(x), y: Math.round(y) });
      }
    } else if (contextLower.includes('random') || contextLower.includes('distribution')) {
      // Generate random distribution
      for (let i = 0; i < pointCount; i++) {
        points.push({
          x: Math.round(Math.random() * 100),
          y: Math.round(Math.random() * 100)
        });
      }
    } else {
      // Generate clustered data
      const clusters = 3;
      const pointsPerCluster = Math.floor(pointCount / clusters);
      
      for (let cluster = 0; cluster < clusters; cluster++) {
        const centerX = (cluster + 1) * (100 / (clusters + 1));
        const centerY = Math.random() * 100;
        
        for (let i = 0; i < pointsPerCluster; i++) {
          points.push({
            x: Math.round(centerX + (Math.random() - 0.5) * 30),
            y: Math.round(centerY + (Math.random() - 0.5) * 30)
          });
        }
      }
    }
    
    return { points };
  }
}