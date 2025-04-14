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

// Helper function to update an existing Google Calendar event
const updateCalendarEvent = async (todo, tokens) => {
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

    const response = await calendar.events.patch({
      calendarId: 'primary',
      eventId: todo.googleEventId,
      resource: event,
    });

    return response;
  } catch (error) {
    console.error('Google Calendar update error:', error.message);
    throw new Error('Failed to update calendar event');
  }
};

// Helper function to delete a Google Calendar event
const deleteCalendarEvent = async (eventId, tokens) => {
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  oAuth2Client.setCredentials(tokens);
  const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

  try {
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
    });
  } catch (error) {
    console.error('Failed to delete calendar event:', error.message);
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

    const googleTokens = req.user.googleTokens; // Ensure this exists in the user object
    if (updatedTodo.googleEventId && updatedTodo.alarmTime && googleTokens) {
      try {
        await updateCalendarEvent(updatedTodo, googleTokens);
      } catch (err) {
        console.error('Calendar event update failed:', err.message);
        // Optionally, you could choose to modify your response to inform the frontend.
      }
    }

    res.json(updatedTodo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteTodo = async (req, res) => {
  try {
    // First: find the todo
    const todo = await Todo.findOne({ _id: req.params.id, userId: req.user.id });
    if (!todo) return res.status(404).json({ message: 'Todo not found' });

    // Then: try deleting calendar event (if it exists)
    const googleTokens = req.user.googleTokens;
    if (todo.googleEventId && googleTokens) {
      try {
        await deleteCalendarEvent(todo.googleEventId, googleTokens);
      } catch (err) {
        console.error('Calendar event deletion failed:', err.message);
        // optional: log to frontend
      }
    }

    // Finally: delete the todo from DB
    await todo.deleteOne();
    res.json({ message: 'Todo deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};