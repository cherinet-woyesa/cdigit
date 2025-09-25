import QRCode from 'qrcode';

// Generate QR code as image URL
export const generateBranchQRCode = async (branchId: string, branchName: string): Promise<string> => {
  const qrData = JSON.stringify({
    branchId: branchId,
    branchName: branchName,
    type: 'cbe_branch',
    timestamp: new Date().toISOString()
  });

  try {
    const qrCodeUrl = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#701a75', // Fuchsia color matching your theme
        light: '#FFFFFF'
      }
    });
    return qrCodeUrl;
  } catch (err) {
    console.error('Error generating QR code:', err);
    throw new Error('Failed to generate QR code');
  }
};

// Generate QR code as SVG string
export const generateBranchQRCodeSVG = async (branchId: string, branchName: string): Promise<string> => {
  const qrData = JSON.stringify({
    branchId: branchId,
    branchName: branchName,
    type: 'cbe_branch'
  });

  try {
    const qrCodeSVG = await QRCode.toString(qrData, {
      type: 'svg',
      width: 300,
      margin: 2,
      color: {
        dark: '#701a75',
        light: '#FFFFFF'
      }
    });
    return qrCodeSVG;
  } catch (err) {
    console.error('Error generating QR code SVG:', err);
    throw new Error('Failed to generate QR code');
  }
};