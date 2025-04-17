export interface Exam {
  id?: string;
  title: string;
  description: string;
  duration: number; // in minutes
  totalMarks: number;
  passingMarks: number;
  startTime: Date;
  endTime: Date;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Question {
  id?: string;
  examId: string;
  questionText: string;
  options: string[];
  correctAnswer: number;
  marks: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ExamSubmission {
  id?: string;
  examId: string;
  userId: string;
  answers: {
    questionId: string;
    selectedAnswer: number;
  }[];
  score?: number;
  submittedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
} 