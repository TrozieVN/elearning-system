const express = require('express');
const path = require('path');
const multer = require('multer');
const pdfParse = require('pdf-parse');

const app = express();
const PORT = 3000;

const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

let submissions = [];
// Cấu trúc câu hỏi hỗ trợ: type ('quiz' hoặc 'essay'), options, correctAnswer
let currentQuestions = [
    { 
        id: 1, 
        type: "quiz",
        question: "What is the capital of Vietnam?", 
        options: ["Hanoi", "Ho Chi Minh", "Da Nang", "Hue"], 
        correctAnswer: "Hanoi" 
    },
    { 
        id: 2, 
        type: "essay",
        question: "Explain the importance of learning English in international business.", 
        options: [], 
        correctAnswer: "Communication, global market, career opportunities" 
    }
];

// API lấy danh sách câu hỏi
app.get('/api/questions', (req, res) => {
    res.json(currentQuestions);
});

// API giáo viên lưu / cập nhật câu hỏi (bao gồm cả trắc nghiệm và tự luận)
app.post('/api/questions', (req, res) => {
    const { questions } = req.body;
    if (Array.isArray(questions)) {
        currentQuestions = questions;
        res.json({ success: true, message: "Đã lưu danh sách câu hỏi thành công!" });
    } else {
        res.status(400).json({ success: false, message: "Dữ liệu không hợp lệ!" });
    }
});

// API học sinh nộp bài (xử lý cả điểm số trắc nghiệm và bài làm tự luận)
app.post('/api/submit', (req, res) => {
    const { studentName, score, details } = req.body;
    if (!studentName) {
        return res.status(400).json({ success: false, message: "Vui lòng nhập tên học sinh!" });
    }
    submissions.push({
        studentName,
        score,
        details,
        time: new Date().toLocaleString('vi-VN')
    });
    res.json({ success: true, message: "Nộp bài thành công!" });
});

// API giáo viên xem danh sách bài làm của học sinh
app.get('/api/submissions', (req, res) => {
    res.json(submissions);
});

// API upload PDF dự phòng an toàn
app.post('/api/upload-pdf', upload.single('pdfFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "Chưa chọn file PDF!" });
        }

        const cleanName = req.file.originalname.replace(/\.[^/.]+\$/, "");
        // Nạp mẫu linh hoạt, giáo viên có thể vào trình soạn thảo chỉnh lại ngay lập tức
        currentQuestions = [
            {
                id: 1,
                type: "quiz",
                question: `Trắc nghiệm từ tài liệu: ${cleanName}`,
                options: ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
                correctAnswer: "Đáp án A"
            },
            {
                id: 2,
                type: "essay",
                question: `Tự luận từ tài liệu: ${cleanName} - Trình bày ý chính của bài.`,
                options: [],
                correctAnswer: "Ý chính mẫu"
            }
        ];

        res.json({ 
            success: true, 
            message: `Tải file thành công! Đã nạp 2 câu hỏi mẫu (Trắc nghiệm & Tự luận). Giáo viên có thể tùy chỉnh bên dưới.`, 
            questions: currentQuestions 
        });

    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi xử lý file PDF!" });
    }
});

app.listen(PORT, () => {
    console.log(`Hệ thống đang chạy tại: http://localhost:${PORT}`);
});
// API xóa bài làm của học sinh theo vị trí (index)
app.delete('/api/submissions/:index', (req, res) => {
    const index = parseInt(req.params.index);
    if (index >= 0 && index < submissions.length) {
        submissions.splice(index, 1);
        res.json({ success: true, message: "Đã xóa bài làm thành công!" });
    } else {
        res.status(400).json({ success: false, message: "Không tìm thấy bài làm cần xóa!" });
    }
});