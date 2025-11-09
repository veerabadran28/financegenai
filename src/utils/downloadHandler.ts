export const downloadAsDocument = (messages: any[], filename: string = 'chat-export.html') => {
  const htmlContent = generateHTMLDocument(messages);
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  
  URL.revokeObjectURL(url);
};

const generateHTMLDocument = (messages: any[]): string => {
  const messagesHTML = messages.map(message => `
    <div class="message ${message.type}">
      <div class="message-header">
        <strong>${message.type === 'user' ? 'You' : 'Assistant'}</strong>
        <span class="timestamp">${message.timestamp.toLocaleString()}</span>
      </div>
      <div class="message-content">
        ${message.content.replace(/\n/g, '<br>')}
      </div>
      ${message.diagram ? `
        <div class="diagram-section">
          <h4>Diagram: ${message.diagram.title}</h4>
          <div class="diagram-placeholder">
            [Diagram content - ${message.diagram.nodes.length} nodes, ${message.diagram.connections.length} connections]
          </div>
        </div>
      ` : ''}
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Chat Export - Document Analysis</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background: #f9fafb;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding: 20px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .message {
          margin-bottom: 20px;
          padding: 15px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .message.user {
          border-left: 4px solid #3b82f6;
        }
        .message.assistant {
          border-left: 4px solid #14b8a6;
        }
        .message-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          font-size: 14px;
        }
        .timestamp {
          color: #666;
        }
        .message-content {
          white-space: pre-wrap;
        }
        .diagram-section {
          margin-top: 15px;
          padding: 15px;
          background: #f3f4f6;
          border-radius: 6px;
        }
        .diagram-placeholder {
          padding: 20px;
          background: #e5e7eb;
          border-radius: 4px;
          text-align: center;
          color: #6b7280;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Insights-B Chat Export</h1>
        <p>Generated on ${new Date().toLocaleString()}</p>
      </div>
      <div class="messages">
        ${messagesHTML}
      </div>
    </body>
    </html>
  `;
};