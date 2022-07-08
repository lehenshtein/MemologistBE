import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import Book from '../models/Books.model';

const createBook = (req: Request, res: Response, next: NextFunction) => {
  const { title, author } = req.body;
  const book = new Book({
    _id: new mongoose.Types.ObjectId(),
    title,
    author
  });

  return book.save()
    .then(book => res.status(201).json(book))
    .catch(err => res.status(500).json({ message: 'Server error', err }));
};

const readBook = (req: Request, res: Response, next: NextFunction) => {
  const { bookId } = req.params;

  return Book.findById(bookId)
    .populate('author')//form ref author we get author obj and can get his name
    .select('-__v')//get rid of field
    .select('-true')//get rid of field
    .then(book => book ? res.status(200).json(book) : res.status(404).json({ message: 'not found' }))
    .catch(err => res.status(500).json({ message: 'Server error', err }));
};

const readAll = (req: Request, res: Response, next: NextFunction) => {
  return Book.find()
    .populate('author')
    .select('-__v')//get rid of field
    .select('-true')//get rid of field
    .then(books => res.status(200).json(books))
    .catch(err => res.status(500).json({ message: 'Server error', err }));
};

const updateBook = (req: Request, res: Response, next: NextFunction) => {
  const { bookId } = req.params;

  return Book.findById(bookId)
    .then(book => {
      if (book) {
        book.set(req.body);

        return book.save()
          .then(book => res.status(201).json(book))
          .catch(err => res.status(500).json({ message: 'Server error', err }));
      } else {
        res.status(404).json({ message: 'not found' });
      }
    })
    .catch(err => res.status(500).json({ message: 'Server error', err }));
};

const deleteBook = (req: Request, res: Response, next: NextFunction) => {
  const { bookId } = req.params;

  return Book.findByIdAndDelete(bookId)
    .then(book => book
      ? res.status(201).json({ message: 'deleted' })
      : res.status(404).json({ message: 'not found' }))
    .catch(err => res.status(500).json({ message: 'Server error', err }));
};

export default { createBook, readBook, readAll, updateBook, deleteBook };
