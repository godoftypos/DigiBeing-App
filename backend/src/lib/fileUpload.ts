import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Define the directory to store uploaded files
const uploadDir = path.join(__dirname, '../uploads');

// Ensure the directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    },
});

// File filter (optional – you can customize this)
const fileFilter = (_req: Express.Request, _file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Accept all files for now
    cb(null, true);
};

// Multer upload middleware
const upload = multer({ storage, fileFilter });

export function generateFileUrl(filename: string): string {
    return `${process.env.URL}/uploads/${filename}`;
}


export default upload;
