const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const featureFlagMiddleware = require('../middleware/featureFlagMiddleware');

// In-memory data store
let items = [
  { id: '1', name: 'Sample Item 1', description: 'This is a sample item', createdAt: new Date().toISOString() },
  { id: '2', name: 'Sample Item 2', description: 'Another sample item', createdAt: new Date().toISOString() }
];

/**
 * @route   GET /api/items
 * @desc    Get all items
 * @access  Public
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    count: items.length,
    data: items
  });
});

/**
 * @route   GET /api/items/:id
 * @desc    Get a single item by ID
 * @access  Public
 */
router.get('/:id', (req, res) => {
  const item = items.find(i => i.id === req.params.id);
  
  if (!item) {
    return res.status(404).json({
      success: false,
      message: 'Item not found'
    });
  }
  
  res.json({
    success: true,
    data: item
  });
});

/**
 * @route   POST /api/items
 * @desc    Create a new item
 * @access  Public (protected by feature flag)
 */
router.post('/', featureFlagMiddleware('enableCreate'), (req, res) => {
  const { name, description } = req.body;
  
  if (!name) {
    return res.status(400).json({
      success: false,
      message: 'Name is required'
    });
  }
  
  const newItem = {
    id: uuidv4(),
    name,
    description: description || '',
    createdAt: new Date().toISOString()
  };
  
  items.push(newItem);
  
  res.status(201).json({
    success: true,
    message: 'Item created successfully',
    data: newItem
  });
});

/**
 * @route   PUT /api/items/:id
 * @desc    Update an item
 * @access  Public (protected by feature flag)
 */
router.put('/:id', featureFlagMiddleware('enableUpdate'), (req, res) => {
  const { name, description } = req.body;
  const itemIndex = items.findIndex(i => i.id === req.params.id);
  
  if (itemIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Item not found'
    });
  }
  
  if (name) items[itemIndex].name = name;
  if (description !== undefined) items[itemIndex].description = description;
  items[itemIndex].updatedAt = new Date().toISOString();
  
  res.json({
    success: true,
    message: 'Item updated successfully',
    data: items[itemIndex]
  });
});

/**
 * @route   DELETE /api/items/:id
 * @desc    Delete an item
 * @access  Public (protected by feature flag)
 */
router.delete('/:id', featureFlagMiddleware('enableDelete'), (req, res) => {
  const itemIndex = items.findIndex(i => i.id === req.params.id);
  
  if (itemIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Item not found'
    });
  }
  
  const deletedItem = items.splice(itemIndex, 1)[0];
  
  res.json({
    success: true,
    message: 'Item deleted successfully',
    data: deletedItem
  });
});

module.exports = router;
