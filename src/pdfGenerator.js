import jsPDF from 'jspdf';

export function generateClientPDF(state, metrics) {
  const doc = new jsPDF();
  
  // PAGE 1: MACRO PORTFOLIO VIEW
  doc.setFillColor(6, 8, 13);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(212, 175, 55);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('ELITE WEALTHOS', 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(200, 200, 200);
  doc.text('Confidential Wealth & Estate Portfolio Summary', 14, 28);
  doc.text(`Client ID: ${state.clientId}`, 150, 20);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 150, 28);
  
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.8);
  doc.line(14, 45, 196, 45);
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Client Profile', 14, 54);
  
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Full Name: ${state.fullName || 'N/A'}`, 14, 61);
  doc.text(`Occupation: ${state.occupation || 'N/A'} (${state.businessType || 'N/A'})`, 14, 67);
  doc.text(`Company: ${state.companyName || 'N/A'}`, 14, 73);
  doc.text(`Annual Income: ${state.annualIncome || 'N/A'}`, 110, 61);
  doc.text(`Net Worth: ${state.netWorth || 'N/A'}`, 110, 67);
  doc.text(`Location: ${state.city || 'N/A'}`, 110, 73);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Executive AI Wealth Metrics', 14, 85);
  
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`AI Wealth Score: ${metrics.aiWealthScore} / 100`, 14, 92);
  doc.text(`Risk Category: ${metrics.riskCategory} (Score: ${metrics.riskScore})`, 14, 98);
  doc.text(`Emergency Fund Score: ${metrics.emergencyScore} / 100`, 14, 104);
  doc.text(`Estimated Tax Reserve: Rs. 15.00 Cr`, 110, 92);
  doc.text(`Family Protection Score: ${metrics.familyProtectionScore} / 100`, 110, 98);
  doc.text(`Blended CAGR: ${metrics.blendedYield ? metrics.blendedYield.toFixed(2) : '9.95'}%`, 110, 104);

  // Capture Wealth growth line chart canvas
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('3. Macro Portfolio Projections', 14, 115);
  
  try {
    const lineChartCanvas = document.getElementById('wealthLineChart');
    if (lineChartCanvas) {
      const lineImg = lineChartCanvas.toDataURL('image/png');
      doc.addImage(lineImg, 'PNG', 14, 120, 180, 75);
    }
  } catch (err) {
    console.warn('Could not add Wealth line chart to PDF:', err);
  }

  // Capture Asset allocation doughnut chart canvas
  try {
    const doughnutChartCanvas = document.getElementById('resAllocChart');
    if (doughnutChartCanvas) {
      const doughnutImg = doughnutChartCanvas.toDataURL('image/png');
      doc.addImage(doughnutImg, 'PNG', 14, 205, 80, 50);
      
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.text('Strategic Asset Allocation breakdown:', 105, 215);
      doc.setFont('helvetica', 'normal');
      doc.text(`- Direct Equity: ${metrics.allocation.stocks}%`, 105, 222);
      doc.text(`- Mutual Funds & ETFs: ${metrics.allocation.mutualFunds}%`, 105, 228);
      doc.text(`- Alternatives (AIF/PMS): ${metrics.allocation.alts}%`, 105, 234);
      doc.text(`- Cash / Liquids: ${metrics.allocation.cash}%`, 105, 240);
    }
  } catch (err) {
    console.warn('Could not add Doughnut allocation chart to PDF:', err);
  }

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Page 1 of 3 | Powered by Antigravity AI Engine.', 14, 285);

  // PAGE 2: MICRO GOALS PERFORMANCE
  doc.addPage();
  doc.setFillColor(6, 8, 13);
  doc.rect(0, 0, 210, 15, 'F');
  doc.setTextColor(212, 175, 55);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('ELITE WEALTHOS | MICRO GOALS & RUNWAYS', 14, 10);
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(13);
  doc.text('4. Micro Goals Allocation & Compounding', 14, 25);

  const goals = [
    { key: 'tax', name: 'Tax Reserve Portfolio' },
    { key: 'emergency', name: 'Health Emergency Reserve' },
    { key: 'lifestyle', name: 'Lifestyle Maintenance Fund' },
    { key: 'education', name: 'Higher Education Sleeve' },
    { key: 'marriage', name: 'Marriage Planning Sleeve' }
  ];

  let y = 32;
  goals.forEach(g => {
    if (y > 240) {
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('Page 2 of 3 | Powered by Antigravity AI Engine.', 14, 285);
      doc.addPage();
      y = 25;
      doc.setFillColor(6, 8, 13);
      doc.rect(0, 0, 210, 15, 'F');
      doc.setTextColor(212, 175, 55);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('ELITE WEALTHOS | MICRO GOALS & RUNWAYS (CONTINUED)', 14, 10);
      doc.setTextColor(0, 0, 0);
    }

    const stateVal = window.resultsMicroState ? window.resultsMicroState[g.key] : null;
    const s = stateVal || { principal: 1.0, horizon: 10, yield: 7.0 };

    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.text(`${g.name} (Principal: Rs. ${s.principal.toFixed(2)} Cr)`, 14, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Horizon: ${s.horizon} Yrs | Target CAGR: ${s.yield.toFixed(2)}%`, 14, y + 5);

    try {
      const chartCanvas = document.getElementById(`canvas-micro-${g.key}`);
      if (chartCanvas) {
        const img = chartCanvas.toDataURL('image/png');
        doc.addImage(img, 'PNG', 14, y + 8, 70, 25);
      }
    } catch (err) {
      console.warn('Could not add micro chart to PDF:', err);
    }

    doc.setFont('helvetica', 'bold');
    doc.text('Projections:', 110, y + 4);
    doc.setFont('helvetica', 'normal');
    
    const v0 = s.principal;
    const v5 = s.principal * Math.pow(1 + s.yield / 100, Math.min(5, s.horizon));
    const vf = s.principal * Math.pow(1 + s.yield / 100, s.horizon);
    
    doc.text(`- Year 0: Rs. ${v0.toFixed(2)} Cr`, 110, y + 10);
    doc.text(`- Year 5: Rs. ${v5.toFixed(2)} Cr`, 110, y + 15);
    doc.text(`- Year ${s.horizon}: Rs. ${vf.toFixed(2)} Cr`, 110, y + 20);

    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.3);
    doc.line(14, y + 36, 196, y + 36);

    y += 42;
  });

  // PAGE 3: CORE SLEEVES & CHAT STRATEGY
  doc.addPage();
  doc.setFillColor(6, 8, 13);
  doc.rect(0, 0, 210, 15, 'F');
  doc.setTextColor(212, 175, 55);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('ELITE WEALTHOS | CORE PORTFOLIO & AI DISCLOSURES', 14, 10);
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(13);
  doc.text('5. Core Investment Sleeves Projections', 14, 25);

  const coreSleeves = [
    { key: 'equity', name: 'Equity Sleeve Portfolio' },
    { key: 'debt', name: 'Debt Sleeve Portfolio' }
  ];

  y = 32;
  coreSleeves.forEach(g => {
    const stateVal = window.resultsMicroState ? window.resultsMicroState[g.key] : null;
    const s = stateVal || { principal: 10.0, horizon: 40, yield: 8.0 };

    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.text(`${g.name} (Principal: Rs. ${s.principal.toFixed(2)} Cr)`, 14, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Horizon: ${s.horizon} Yrs | Target CAGR: ${s.yield.toFixed(2)}%`, 14, y + 5);

    try {
      const chartCanvas = document.getElementById(`canvas-micro-${g.key}`);
      if (chartCanvas) {
        const img = chartCanvas.toDataURL('image/png');
        doc.addImage(img, 'PNG', 14, y + 8, 70, 25);
      }
    } catch (err) {
      console.warn('Could not add micro chart to PDF:', err);
    }

    doc.setFont('helvetica', 'bold');
    doc.text('Projections:', 110, y + 4);
    doc.setFont('helvetica', 'normal');
    
    const v0 = s.principal;
    const v20 = s.principal * Math.pow(1 + s.yield / 100, Math.min(20, s.horizon));
    const vf = s.principal * Math.pow(1 + s.yield / 100, s.horizon);
    
    doc.text(`- Year 0: Rs. ${v0.toFixed(2)} Cr`, 110, y + 10);
    doc.text(`- Year 20: Rs. ${v20.toFixed(2)} Cr`, 110, y + 15);
    doc.text(`- Year ${s.horizon}: Rs. ${vf.toFixed(2)} Cr`, 110, y + 20);

    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.3);
    doc.line(14, y + 36, 196, y + 36);

    y += 42;
  });

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('6. Interactive Planning Q&A & AI Strategic Analysers', 14, y + 5);

  let chatTextY = y + 14;
  const chatHistoryDiv = document.getElementById('chatHistory');
  if (chatHistoryDiv) {
    const messages = chatHistoryDiv.querySelectorAll('div');
    doc.setFontSize(8.5);
    messages.forEach((msg, idx) => {
      if (chatTextY < 275 && idx < 4) {
        const rawMsg = msg.innerText;
        const splitLines = doc.splitTextToSize(rawMsg, 180);
        doc.setFont('helvetica', rawMsg.startsWith('Client:') ? 'italic' : 'normal');
        doc.text(splitLines, 14, chatTextY);
        chatTextY += (splitLines.length * 4) + 3;
      }
    });
  }

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Page 3 of 3 | Powered by Antigravity AI Engine.', 14, 285);

  doc.save(`Elite_WealthOS_Bespoke_Plan_${state.fullName || 'Client'}.pdf`);
}
