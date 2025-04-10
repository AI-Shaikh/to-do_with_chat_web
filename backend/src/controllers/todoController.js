import Todo from '../models/todoModel.js';
import { google } from 'googleapis';

// Helper function to create a Google Calendar event
const createCalendarEvent = async (todo, tokens) => {
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  oAuth2Client.setCredentials(tokens);
  const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

  try {
    const event = {
      summary: todo.title,
      description: todo.description,
      start: {
        dateTime: new Date(todo.alarmTime).toISOString(),
        timeZone: 'Asia/Kolkata',
      },
      end: {
        dateTime: new Date(new Date(todo.alarmTime).getTime() + 30 * 60 * 1000).toISOString(),
        timeZone: 'Asia/Kolkata',
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });

    return response;
  } catch (error) {
    console.error('Google API Error:', error.message);
    throw new Error('Failed to create calendar event');
  }
};

export const getTodos = async (req, res) => {
  try {
    const todos = await Todo.find({ userId: req.user.id });
    res.json(todos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createTodo = async (req, res) => {
  try {
    const { title, description, alarmTime } = req.body;
    const newTodo = new Todo({
      title,
      description,
      alarmTime,
      userId: req.user.id,
    });

    const savedTodo = await newTodo.save();

    // Get tokens from authenticated user
    const googleTokens = req.user.googleTokens;

    if (alarmTime && googleTokens) {
      try {
        const eventResponse = await createCalendarEvent(savedTodo, googleTokens);
        savedTodo.googleEventId = eventResponse.data.id; // Store event ID
        await savedTodo.save();
      } catch (err) {
        console.error('Calendar event creation failed:', err);
      }
    }

    res.status(201).json(savedTodo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTodo = async (req, res) => {
  try {
    const todo = await Todo.findOne({ _id: req.params.id, userId: req.user.id });
    if (!todo) return res.status(404).json({ message: 'Todo not found' });

    todo.title = req.body.title || todo.title;
    todo.description = req.body.description || todo.description;
    todo.alarmTime = req.body.alarmTime || todo.alarmTime;
    todo.completed = req.body.completed !== undefined ? req.body.completed : todo.completed;

    const updatedTodo = await todo.save();
    res.json(updatedTodo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteTodo = async (req, res) => {
  try {
    const todo = await Todo.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!todo) return res.status(404).json({ message: 'Todo not found' });
    res.json({ message: 'Todo deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
