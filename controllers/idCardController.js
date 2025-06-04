const IdCard = require('../models/IdCard');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');

// Create new ID Card
exports.createIdCard = async (req, res) => {
  try {
    const { fullName, designation, department, idNumber, issueDate, expiryDate } = req.body;
    const photo = req.file ? req.file.filename : null;

    // Check duplicate idNumber
    const existing = await IdCard.findOne({ idNumber });
    if (existing) return res.status(400).json({ message: 'ID Number already exists' });

    const idCard = new IdCard({
      user: req.userId,
      fullName,
      designation,
      department,
      idNumber,
      issueDate,
      expiryDate,
      photo,
    });

    await idCard.save();
    res.status(201).json({ message: 'ID Card created', idCard });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// Get all ID Cards of logged-in user
exports.getAllIdCards = async (req, res) => {
  try {
    const cards = await IdCard.find({ user: req.userId });

    const baseUrl = `${req.protocol}://${req.get('host')}/uploads`;

    const updatedCards = cards.map(card => ({
      ...card.toObject(),
      photo: card.photo ? `${baseUrl}/${card.photo}` : null
    }));

    res.status(200).json(updatedCards);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// Get single ID Card by ID
exports.getIdCardById = async (req, res) => {
  try {
    const card = await IdCard.findOne({ _id: req.params.id, user: req.userId });
    if (!card) return res.status(404).json({ message: 'ID Card not found' });
    res.status(200).json(card);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update ID Card
exports.updateIdCard = async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.file) updateData.photo = req.file.filename;

    const card = await IdCard.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      updateData,
      { new: true }
    );

    if (!card) return res.status(404).json({ message: 'ID Card not found' });

    res.status(200).json({ message: 'ID Card updated', card });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// Delete ID Card
exports.deleteIdCard = async (req, res) => {
  try {
    const card = await IdCard.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!card) return res.status(404).json({ message: 'ID Card not found' });

    // Optional: delete photo file from uploads folder
    if (card.photo) {
      const photoPath = path.join(__dirname, '../uploads', card.photo);
      if (fs.existsSync(photoPath)) fs.unlinkSync(photoPath);
    }

    res.status(200).json({ message: 'ID Card deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Generate PDF of ID Card
exports.generatePDF = async (req, res) => {
  try {
    const card = await IdCard.findOne({ _id: req.params.id, user: req.userId });
    if (!card) return res.status(404).json({ message: 'ID Card not found' });

    const doc = new PDFDocument();
    const fileName = `IDCard_${card.idNumber}.pdf`;

    res.setHeader('Content-disposition', `attachment; filename=${fileName}`);
    res.setHeader('Content-type', 'application/pdf');

    doc.pipe(res);

    doc.fontSize(20).text('ID Card', { align: 'center' });
    doc.moveDown();

    doc.fontSize(14).text(`Full Name: ${card.fullName}`);
    doc.text(`Designation: ${card.designation || '-'}`);
    doc.text(`Department: ${card.department || '-'}`);
    doc.text(`ID Number: ${card.idNumber}`);
    doc.text(`Issue Date: ${card.issueDate ? card.issueDate.toDateString() : '-'}`);
    doc.text(`Expiry Date: ${card.expiryDate ? card.expiryDate.toDateString() : '-'}`);

    if (card.photo) {
      const photoPath = path.join(__dirname, '../uploads', card.photo);
      if (fs.existsSync(photoPath)) {
        doc.moveDown();
        doc.image(photoPath, { fit: [150, 150], align: 'center' });
      }
    }

    doc.end();
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};




// Generate a single PDF with all ID Cards of the logged-in user


exports.generateAllPDFs = async (req, res) => {
  try {
    const cards = await IdCard.find({ user: req.userId });
    if (!cards || cards.length === 0) {
      return res.status(404).json({ message: 'No ID Cards found' });
    }

    const doc = new PDFDocument();
    const fileName = `All_IDCards_${Date.now()}.pdf`;

    res.setHeader('Content-disposition', `attachment; filename=${fileName}`);
    res.setHeader('Content-type', 'application/pdf');

    doc.pipe(res);

    cards.forEach((card, index) => {
      if (index > 0) doc.addPage(); // Add new page for each ID Card

      doc.fontSize(20).text('ID Card', { align: 'center' });
      doc.moveDown();

      doc.fontSize(14).text(`Full Name: ${card.fullName}`);
      doc.text(`Designation: ${card.designation || '-'}`);
      doc.text(`Department: ${card.department || '-'}`);
      doc.text(`ID Number: ${card.idNumber}`);
      doc.text(`Issue Date: ${card.issueDate ? new Date(card.issueDate).toDateString() : '-'}`);
      doc.text(`Expiry Date: ${card.expiryDate ? new Date(card.expiryDate).toDateString() : '-'}`);

      if (card.photo) {
        const photoPath = path.join(__dirname, '../uploads', card.photo);
        if (fs.existsSync(photoPath)) {
          doc.moveDown();
          doc.image(photoPath, { fit: [150, 150], align: 'center' });
        }
      }
    });

    doc.end();
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.bulkUploadFromExcel = async (req, res) => {
  try {
    console.log('Received bulk upload request');
    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const filePath = req.file.path;
    console.log('Excel file path:', filePath);

    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const records = XLSX.utils.sheet_to_json(sheet);
    console.log('Total records found in Excel:', records.length);
    const savedCards = [];

    for (const [index, record] of records.entries()) {
      console.log(`Processing record ${index + 1}:`, record);
      const {
        fullName,
        designation,
        department,
        idNumber,
        issueDate,
        expiryDate,
        photoFileName
      } = record;

      const existing = await IdCard.findOne({ idNumber });
      if (existing) {
        console.log(`Skipping duplicate ID Number: ${idNumber}`);
        continue;
      }

      const card = new IdCard({
        user: req.userId,
        fullName,
        designation,
        department,
        idNumber,
        issueDate: issueDate ? new Date(issueDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        photo: photoFileName || null,
      });

      await card.save();
      console.log(`Saved ID Card with ID Number: ${idNumber}`);
      savedCards.push(card);
    }

    fs.unlinkSync(filePath);
    console.log('Deleted uploaded Excel file after processing');

    res.status(201).json({
      message: `${savedCards.length} ID cards imported successfully`,
      data: savedCards
    });
  } catch (error) {
    console.error('Bulk import failed:', error);
    res.status(500).json({ message: 'Bulk import failed', error: error.message });
  }
};


