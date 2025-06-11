import pdfMake from 'pdfmake/build/pdfmake';
import vfs_fonts from 'pdfmake/build/vfs_fonts';

// Fixed: Direct assignment without .pdfMake property
pdfMake.vfs = vfs_fonts;