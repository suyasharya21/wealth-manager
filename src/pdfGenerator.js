import jsPDF from 'jspdf';

export function generateClientPDF(state, metrics) {
  const doc = new jsPDF();
  
  // Luxury Dark Header Accent
  doc.setFillColor(6, 8, 13);
  doc.rect(0, 0, 210, 40, 'F');
  
  // Title
  doc.setTextColor(212, 175, 55);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('ELITE WEALTHOS', 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(200, 200, 200);
  doc.text('Confidential Wealth & Estate Portfolio Summary', 14, 28);
  doc.text(`Client ID: ${state.clientId}`, 150, 20);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 150, 28);
  
  // Divider line
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.8);
  doc.line(14, 45, 196, 45);
  
  // Section 1: Client Profile
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Client Profile', 14, 55);
  
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Full Name: ${state.fullName || 'N/A'}`, 14, 63);
  doc.text(`Occupation: ${state.occupation || 'N/A'} (${state.businessType || 'N/A'})`, 14, 69);
  doc.text(`Company: ${state.companyName || 'N/A'}`, 14, 75);
  doc.text(`Annual Income: ${state.annualIncome || 'N/A'}`, 110, 63);
  doc.text(`Net Worth: ${state.netWorth || 'N/A'}`, 110, 69);
  doc.text(`Location: ${state.city || 'N/A'}`, 110, 75);
  
  // Section 2: AI Wealth & Tax Metrics
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Executive AI Wealth Metrics', 14, 88);
  
  const taxFormatted = metrics.taxReserve >= 10000000 
    ? `Rs. ${(metrics.taxReserve / 10000000).toFixed(2)} Cr (${(state.taxRate * 100).toFixed(0)}% Rate)` 
    : `Rs. ${(metrics.taxReserve / 100000).toFixed(1)} Lakhs`;

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`AI Wealth Score: ${metrics.aiWealthScore} / 100`, 14, 96);
  doc.text(`Risk Category: ${metrics.riskCategory} (Score: ${metrics.riskScore})`, 14, 102);
  doc.text(`Emergency Fund Score: ${metrics.emergencyScore} / 100`, 14, 108);
  doc.text(`Estimated Tax Reserve: ${taxFormatted}`, 110, 96);
  doc.text(`Family Protection Score: ${metrics.familyProtectionScore} / 100`, 110, 102);

  // Section 3: Key Financial Goals
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('3. Key Goals & SIP Math', 14, 120);

  let y = 128;
  (metrics.calculatedGoals || []).forEach((g, idx) => {
    if (y < 160) {
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.text(`${idx + 1}. ${g.type} (Horizon: ${g.targetYears} Years)`, 14, y);
      doc.setFont('helvetica', 'normal');
      const targetValText = g.targetAmount >= 10000000 ? `Rs. ${(g.targetAmount / 10000000).toFixed(2)} Cr` : `Rs. ${(g.targetAmount / 100000).toFixed(0)} Lakhs`;
      doc.text(`Target Cost: ${targetValText} | Blended Yield: ${g.blendedYield.toFixed(1)}% | Success Prob: ${g.probability}%`, 14, y + 5);
      y += 12;
    }
  });

  // Page 2: Graphs & Interactive Q&A
  doc.addPage();
  
  // Title Header Page 2
  doc.setFillColor(6, 8, 13);
  doc.rect(0, 0, 210, 15, 'F');
  doc.setTextColor(212, 175, 55);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('ELITE WEALTHOS | ANALYTICAL CHARTS & STRATEGIC RECOMMENDATIONS', 14, 10);

  // Section 4: Charts
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('4. Portfolio Allocation & Projections', 14, 25);

  // Capture Wealth growth line chart canvas
  try {
    const lineChartCanvas = document.getElementById('wealthLineChart');
    if (lineChartCanvas) {
      const lineImg = lineChartCanvas.toDataURL('image/png');
      doc.addImage(lineImg, 'PNG', 14, 32, 180, 75);
    }
  } catch (err) {
    console.warn('Could not add Wealth line chart to PDF:', err);
  }

  // Capture Asset allocation doughnut chart canvas
  try {
    const doughnutChartCanvas = document.getElementById('resAllocChart');
    if (doughnutChartCanvas) {
      const doughnutImg = doughnutChartCanvas.toDataURL('image/png');
      doc.addImage(doughnutImg, 'PNG', 14, 112, 80, 50);
      
      // Print Allocation textual details on the right of the doughnut
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.text('Strategic Asset Allocation breakdown:', 105, 118);
      doc.setFont('helvetica', 'normal');
      doc.text(`- Direct Equity: ${metrics.allocation.stocks}%`, 105, 126);
      doc.text(`- Mutual Funds & ETFs: ${metrics.allocation.mutualFunds}%`, 105, 132);
      doc.text(`- Alternatives (AIF/PMS): ${metrics.allocation.alts}%`, 105, 138);
      doc.text(`- Cash / Liquids: ${metrics.allocation.cash}%`, 105, 144);
    }
  } catch (err) {
    console.warn('Could not add Doughnut allocation chart to PDF:', err);
  }

  // Section 5: Q&A Chat history & AI explanation
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('5. Interactive Planning Q&A & Estate Strategy', 14, 172);

  // Retrieve chat elements
  let chatTextY = 180;
  const chatHistoryDiv = document.getElementById('chatHistory');
  if (chatHistoryDiv) {
    const messages = chatHistoryDiv.querySelectorAll('div');
    doc.setFontSize(9);
    messages.forEach((msg, idx) => {
      if (chatTextY < 270 && idx < 5) { // Limit to first 5 Q&A threads to avoid page overflow
        const rawMsg = msg.innerText;
        // Split text to fit page width
        const splitLines = doc.splitTextToSize(rawMsg, 180);
        doc.setFont('helvetica', rawMsg.startsWith('Client:') ? 'italic' : 'normal');
        doc.text(splitLines, 14, chatTextY);
        chatTextY += (splitLines.length * 4.5) + 3;
      }
    });
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Generated dynamically from Elite WealthOS Secure Database - Powered by Antigravity AI Engine.', 14, 288);

  doc.save(`Elite_WealthOS_Advisory_Summary_${state.clientId}.pdf`);
}
