const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/**
 * Create a new room
 */
router.post('/create', async (req, res) => {
  const { roomName, admin, visibility = 'public', password } = req.body;

  if (!roomName || !admin) {
    return res.status(400).json({ 
      error: 'Room name and admin name are required',
    });
  }

  if (visibility === 'private' && !password) {
    return res.status(400).json({ 
      error: 'Password is required for private rooms',
    });
  }

  try {
    const roomId = uuidv4();
    const hashedPassword = visibility === 'private' 
      ? await bcrypt.hash(password, 10) 
      : null;

    const room = new Room({
      roomId,
      roomName,
      admin,
      visibility,
      password: hashedPassword,
      code: '',            // Default code for CodeEditor
      language: 'javascript' // Default language
    });

    await room.save();

    res.status(201).json({ 
      success: true,
      roomId,
      roomName,
      visibility
    });
  } catch (err) {
    console.error('Room creation error:', err);
    res.status(500).json({ 
      error: 'Failed to create room',
      details: err.message 
    });
  }
});

/**
 * Join an existing room
 */
router.post('/join', async (req, res) => {
  const { roomId, password } = req.body;

  if (!roomId) {
    return res.status(400).json({ error: 'Room ID is required' });
  }

  try {
    const room = await Room.findOne({ roomId }).select('+password');
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.visibility === 'private') {
      if (!password) {
        return res.status(401).json({ error: 'Password is required' });
      }

      const isMatch = await bcrypt.compare(password, room.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid password' });
      }
    }

    res.json({ 
      success: true,
      roomName: room.roomName,
      visibility: room.visibility,
      admin: room.admin
    });
  } catch (err) {
    console.error('Join room error:', err);
    res.status(500).json({ error: 'Failed to join room', details: err.message });
  }
});

/**
 * Get visibility of a room (public/private)
 */
router.get('/:roomId/visibility', async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json({ 
      success: true,
      visibility: room.visibility,
      roomName: room.roomName
    });
  } catch (err) {
    console.error('Visibility check error:', err);
    res.status(500).json({ error: 'Failed to check room visibility', details: err.message });
  }
});

/**
 * Get list of participants in a room
 */
router.get('/:roomId/participants', async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json(room.participants);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Remove a participant by username
 */
router.delete('/:roomId/participants/:username', async (req, res) => {
  try {
    await Room.updateOne(
      { roomId: req.params.roomId },
      { $pull: { participants: { username: req.params.username } } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

