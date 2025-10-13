// Mock printer service for kiosk queue tickets
export interface QueueTicket {
  queueNumber: string;
  tokenNumber: string;
  serviceType: string;
  timestamp: string;
  branchName: string;
  customerName?: string;
}

export const printerService = {
  /**
   * Generate a printable queue ticket
   */
  generateQueueTicket: (ticketData: QueueTicket): string => {
    const {
      queueNumber,
      tokenNumber,
      serviceType,
      timestamp,
      branchName,
      customerName
    } = ticketData;

    // Simple text-based ticket format
    const ticket = `
╔══════════════════════════════════════════════════════════════╗
║                 COMMERCIAL BANK OF ETHIOPIA                  ║
║                    ──────────────────────                    ║
║                                                              ║
║  Queue Number:      ${queueNumber.padEnd(20)}          ║
║  Token Number:      ${tokenNumber.padEnd(20)}          ║
║  Service Type:      ${serviceType.padEnd(20)}          ║
║  Branch:            ${branchName.padEnd(20)}          ║
${customerName ? `║  Customer:          ${customerName.padEnd(20)}          ║` : ''}
║                                                              ║
║  Time:              ${timestamp.padEnd(20)}          ║
║                                                              ║
║  Please wait for your number to be called.                   ║
║  Estimated wait time: 5-10 minutes                           ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
    `.trim();

    return ticket;
  },

  /**
   * Print queue ticket (in browser - would connect to actual printer in production)
   */
  printQueueTicket: async (ticketData: QueueTicket): Promise<void> => {
    try {
      // Generate the ticket
      const ticket = printerService.generateQueueTicket(ticketData);
      
      // In a real implementation, this would connect to a thermal printer
      // For now, we'll show an alert and copy to clipboard
      
      // Copy to clipboard
      await navigator.clipboard.writeText(ticket);
      
      // Show alert with ticket
      alert(`Queue Ticket Generated!
      
${ticket}

Copied to clipboard. In a real kiosk, this would print automatically.`);
      
      console.log('Queue ticket generated:', ticket);
    } catch (error) {
      console.error('Failed to print queue ticket:', error);
      throw new Error('Failed to print queue ticket');
    }
  },

  /**
   * Generate a sample queue ticket for testing
   */
  generateSampleTicket: (): QueueTicket => {
    // Format date manually
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-US', { 
      month: 'short', 
      day: '2-digit', 
      year: 'numeric' 
    });
    const formattedTime = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    });
    
    return {
      queueNumber: 'Q001',
      tokenNumber: 'TKN-2024-001',
      serviceType: 'Cash Deposit',
      timestamp: `${formattedDate} ${formattedTime}`,
      branchName: 'Head Office',
      customerName: 'John Doe'
    };
  }
};

export default printerService;