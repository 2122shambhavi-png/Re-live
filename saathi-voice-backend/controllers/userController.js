const db = require('../config/database');
const { rolePersonalities } = require('../config/personalities');

class UserController {
  /**
   * Create or get user
   */
  async createUser(req, res) {
    try {
      const { userId, name, phone, email } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      // Check if user exists
      const existing = await db.query(
        'SELECT * FROM users WHERE user_id = $1',
        [userId]
      );

      if (existing.rows.length > 0) {
        return res.json({ 
          user: existing.rows[0],
          message: 'User already exists'
        });
      }

      // Create new user
      const result = await db.query(
        `INSERT INTO users (user_id, name, phone, email, current_role, language_mix, created_at)
         VALUES ($1, $2, $3, $4, 'daughter', 'hi-en', NOW())
         RETURNING *`,
        [userId, name, phone, email]
      );

      res.status(201).json({ 
        user: result.rows[0],
        message: 'User created successfully'
      });
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  }

  /**
   * Get user profile
   */
  async getUser(req, res) {
    try {
      const { userId } = req.params;

      const result = await db.query(
        'SELECT * FROM users WHERE user_id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ user: result.rows[0] });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Failed to get user' });
    }
  }

  /**
   * Select conversation role
   */
  async selectRole(req, res) {
    try {
      const { userId, role, languageMix } = req.body;

      if (!userId || !role) {
        return res.status(400).json({ error: 'userId and role are required' });
      }

      // Validate role
      if (!rolePersonalities[role]) {
        return res.status(400).json({ 
          error: 'Invalid role',
          availableRoles: Object.keys(rolePersonalities)
        });
      }

      // Update user's current role
      await db.query(
        'UPDATE users SET current_role = $1, language_mix = $2, last_active = NOW() WHERE user_id = $3',
        [role, languageMix || 'hi-en', userId]
      );

      res.json({ 
        message: 'Role selected successfully',
        role: role,
        personality: rolePersonalities[role].emotionalTone
      });
    } catch (error) {
      console.error('Select role error:', error);
      res.status(500).json({ error: 'Failed to select role' });
    }
  }

  /**
   * Get available roles
   */
  async getAvailableRoles(req, res) {
    try {
      const roles = Object.keys(rolePersonalities).map(role => ({
        id: role,
        name: role.charAt(0).toUpperCase() + role.slice(1),
        description: rolePersonalities[role].emotionalTone
      }));

      res.json({ roles });
    } catch (error) {
      console.error('Get roles error:', error);
      res.status(500).json({ error: 'Failed to get roles' });
    }
  }

  /**
   * Update user preferences
   */
  async updatePreferences(req, res) {
    try {
      const { userId } = req.params;
      const { languageMix, name } = req.body;

      const updates = [];
      const values = [];
      let paramCount = 1;

      if (languageMix) {
        updates.push(`language_mix = $${paramCount++}`);
        values.push(languageMix);
      }

      if (name) {
        updates.push(`name = $${paramCount++}`);
        values.push(name);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No updates provided' });
      }

      values.push(userId);

      await db.query(
        `UPDATE users SET ${updates.join(', ')}, last_active = NOW() WHERE user_id = $${paramCount}`,
        values
      );

      res.json({ message: 'Preferences updated successfully' });
    } catch (error) {
      console.error('Update preferences error:', error);
      res.status(500).json({ error: 'Failed to update preferences' });
    }
  }
}

module.exports = new UserController();
