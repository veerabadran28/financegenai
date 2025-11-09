import { DiagramData, DiagramNode, DiagramConnection } from '../types';
import { DynamicDiagramGenerator } from '../services/diagramGenerator';

export const generateMockResponse = (question: string, hasDocument: boolean): string => {
  const isFlowchartRequest = question.toLowerCase().includes('flowchart') || 
                           question.toLowerCase().includes('diagram') ||
                           question.toLowerCase().includes('process flow');

  if (isFlowchartRequest) {
    return "I'll create a flowchart based on the document content. Here's a visual representation of the process:";
  }

  const responses = [
    `Based on the ${hasDocument ? 'uploaded document' : 'information provided'}, here are the key insights:

**Main Points:**
- The document outlines a comprehensive approach to process optimization
- Key stakeholders include management, operations, and quality assurance teams
- Implementation timeline spans 6-12 months with phased rollout

**Recommendations:**
1. Establish clear communication channels
2. Implement regular review cycles
3. Monitor key performance indicators
4. Provide adequate training for all team members

**Next Steps:**
- Schedule stakeholder meetings
- Develop detailed implementation plan
- Allocate necessary resources`,

    `Here's a comprehensive analysis of the ${hasDocument ? 'document' : 'topic'}:

**Executive Summary:**
The document presents a strategic framework for organizational improvement with focus on efficiency and quality enhancement.

**Key Findings:**
- Current processes show 15-20% inefficiency
- Technology integration can reduce manual errors by 60%
- Employee training programs show 40% productivity improvement

**Critical Success Factors:**
1. Leadership commitment and support
2. Clear communication strategy
3. Adequate resource allocation
4. Regular monitoring and feedback`,
  ];

  return responses[Math.floor(Math.random() * responses.length)];
};

export const generateMockDiagram = (question: string): DiagramData => {
  console.log('Generating mock diagram for:', question);
  


  // Use the dynamic diagram generator for all mock diagrams
  return DynamicDiagramGenerator.generateDiagram({
    type: question,
    title: 'Generated Diagram',
    content: question,
    context: question
  });
};