import Role from '../models/Role.mjs';
import User from '../models/User.mjs';

// Get all roles
export const getRoles = async (req, res) => {
  try {
    const roles = await Role.find().sort({ createdAt: -1 });

    // Get member count for each role
    const rolesWithCount = await Promise.all(roles.map(async (roleDoc) => {
      // Use flattenMaps: true to correctly convert Mongoose Maps to plain Objects
      const role = roleDoc.toObject({ flattenMaps: true });
      const count = await User.countDocuments({ customRole: role._id });
      return { ...role, members: count };
    }));

    res.status(200).json({ status: true, roles: rolesWithCount });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ status: false, message: 'Server error fetching roles' });
  }
};

// Create a new role
export const createRole = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;

    if (!name) {
      return res.status(400).json({ status: false, message: 'Role name is required' });
    }

    const existing = await Role.findOne({ name });
    if (existing) {
      return res.status(400).json({ status: false, message: 'Role already exists' });
    }

    const newRole = await Role.create({
      name,
      description,
      permissions: permissions || {}
    });

    res.status(201).json({ status: true, message: 'Role created successfully', role: newRole });
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({ status: false, message: 'Server error creating role' });
  }
};

// Update a role
export const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, permissions } = req.body;

    const role = await Role.findById(id);
    if (!role) return res.status(404).json({ status: false, message: 'Role not found' });
    if (role.isSystem) return res.status(403).json({ status: false, message: 'Cannot modify system roles' });

    role.name = name || role.name;
    role.description = description !== undefined ? description : role.description;
    if (permissions) {
      role.permissions = permissions;
    }

    await role.save();
    res.status(200).json({ status: true, message: 'Role updated successfully', role });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ status: false, message: 'Server error updating role' });
  }
};

// Delete a role
export const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    const role = await Role.findById(id);
    if (!role) return res.status(404).json({ status: false, message: 'Role not found' });
    if (role.isSystem) return res.status(403).json({ status: false, message: 'Cannot delete system roles' });

    // Check if any users are using this role
    const usersCount = await User.countDocuments({ role: id });
    if (usersCount > 0) {
      return res.status(400).json({ status: false, message: `Cannot delete role. It is assigned to ${usersCount} users.` });
    }

    await Role.findByIdAndDelete(id);
    res.status(200).json({ status: true, message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({ status: false, message: 'Server error deleting role' });
  }
};

