import pdfMake from 'pdfmake/build/pdfmake';
import vfs_fonts from 'pdfmake/build/vfs_fonts';

// ✅ FIXED - Type assertion to fix compatibility issue
pdfMake.vfs = (vfs_fonts as any).vfs || vfs_fonts;