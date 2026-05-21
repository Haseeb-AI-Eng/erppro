const router = require('express').Router();
const Organization = require('../models/Organization');
const Employee = require('../models/Employee');
const { requireOrgRole } = require('../middleware/auth');
const { generateOrgOnboarding } = require('../services/groq');

// Get own org
router.get('/me', async (req, res) => {
  try {
    const org = await Organization.findById(req.organizationId);
    res.json({ organization: org });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Update org
router.put('/me', requireOrgRole('org_owner'), async (req, res) => {
  try {
    const org = await Organization.findByIdAndUpdate(req.organizationId, req.body, { new: true });
    res.json({ organization: org });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// AI onboarding
router.post('/ai-onboard', requireOrgRole('org_owner'), async (req, res) => {
  try {
    const org = await Organization.findById(req.organizationId);
    const suggestion = await generateOrgOnboarding(org.industry || req.body.industry || 'General');
    if (!org.aiOnboardingCompleted) {
      org.departments = suggestion.departments.map(d => ({ name: d, description: '' }));
      org.aiOnboardingCompleted = true;
      await org.save();
    }
    res.json({ suggestion, organization: org });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get departments
router.get('/departments', async (req, res) => {
  try {
    const org = await Organization.findById(req.organizationId);
    const empDepts = await Employee.distinct('department', { organizationId: req.organizationId });
    const combined = [...new Set([...org.departments.map(d => d.name), ...empDepts.filter(Boolean)])];
    res.json({ departments: combined });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Add department
router.post('/departments', requireOrgRole('org_owner', 'hr_manager'), async (req, res) => {
  try {
    const org = await Organization.findByIdAndUpdate(req.organizationId, { $push: { departments: { name: req.body.name, description: req.body.description } } }, { new: true });
    res.json({ organization: org });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
