import { apiClient } from '@/lib/api';
import { PaginatedResponse, QueryParams } from './types';

export interface BookCategory {
  id: string;
  name: string;
  description?: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  category?: BookCategory | string;
  publisher?: string;
  publication_year?: number;
  total_copies: number;
  available_copies: number;
  location?: string;
}

export interface BookLoan {
  id: string;
  book: Book | string;
  borrower: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
  } | string;
  issued_date: string;
  due_date: string;
  return_date?: string;
  status: 'ISSUED' | 'RETURNED' | 'OVERDUE' | 'LOST';
  fine_amount: number | string;
  fine_paid: boolean;
  issued_by?: {
    first_name: string;
    last_name: string;
  };
}

export const libraryService = {
  async getBooks(params?: QueryParams): Promise<PaginatedResponse<Book>> {
    const response = await apiClient.get<PaginatedResponse<Book>>('/library/books/', { params });
    return response.data;
  },

  async getBookById(id: string | number): Promise<Book> {
    const response = await apiClient.get<Book>(`/library/books/${id}/`);
    return response.data;
  },

  async createBook(payload: Partial<Book> | Record<string, any>): Promise<Book> {
    const response = await apiClient.post<Book>('/library/books/', payload);
    return response.data;
  },

  async updateBook(id: string | number, payload: Partial<Book> | Record<string, any>): Promise<Book> {
    const response = await apiClient.patch<Book>(`/library/books/${id}/`, payload);
    return response.data;
  },

  async deleteBook(id: string | number): Promise<void> {
    await apiClient.delete(`/library/books/${id}/`);
  },

  async getCategories(params?: QueryParams): Promise<PaginatedResponse<BookCategory>> {
    const response = await apiClient.get<PaginatedResponse<BookCategory>>('/library/categories/', { params });
    return response.data;
  },

  async createCategory(payload: Partial<BookCategory>): Promise<BookCategory> {
    const response = await apiClient.post<BookCategory>('/library/categories/', payload);
    return response.data;
  },

  async getLoans(params?: QueryParams): Promise<PaginatedResponse<BookLoan>> {
    const response = await apiClient.get<PaginatedResponse<BookLoan>>('/library/loans/', { params });
    return response.data;
  },

  async issueLoan(payload: {
    book: string;
    borrower: string;
    due_date: string;
  }): Promise<BookLoan> {
    const response = await apiClient.post<BookLoan>('/library/loans/', payload);
    return response.data;
  },

  async returnBook(loanId: string | number): Promise<BookLoan> {
    const response = await apiClient.post<BookLoan>(`/library/loans/${loanId}/return/`);
    return response.data;
  },

  async settleFine(loanId: string | number): Promise<BookLoan> {
    const response = await apiClient.patch<BookLoan>(`/library/loans/${loanId}/`, { fine_paid: true });
    return response.data;
  },
};
