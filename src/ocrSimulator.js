// Simulated AI OCR Document Processing Engine
export function processDocumentOCR(file, documentType) {
  return new Promise((resolve) => {
    setTimeout(() => {
      let extractedData = {};

      if (documentType === 'PAN') {
        extractedData = {
          pan: 'ABCDE1234F',
          fullName: 'Vikramaditya Singhania',
          dob: '1985-06-15'
        };
      } else if (documentType === 'Aadhaar') {
        extractedData = {
          aadhaar: '9876 5432 1098',
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India'
        };
      } else if (documentType === 'GST' || documentType === 'Company Registration') {
        extractedData = {
          companyName: 'Singhania Global Ventures Pvt Ltd',
          occupation: 'Business Owner',
          businessType: 'Private Limited',
          industry: 'Technology'
        };
      } else if (documentType === 'Balance Sheet' || documentType === 'Income Tax Return') {
        extractedData = {
          annualIncome: '5-10Cr',
          netWorth: '50-100Cr',
          liquidAssets: '150000000'
        };
      } else {
        extractedData = {
          docName: file.name,
          status: 'Verified'
        };
      }

      resolve({
        success: true,
        extractedData,
        message: `Successfully extracted attributes from ${file.name}`
      });
    }, 1500);
  });
}
