import pdfMake from 'pdfmake/build/pdfmake';
import vfs_fonts from 'pdfmake/build/vfs_fonts';

pdfMake.vfs = vfs_fonts.pdfMake.vfs;
