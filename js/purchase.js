/**
 * Course Purchase Page Script
 * Loads selected course data and handles bank slip upload.
 */

const getPurchases = () => {
  try {
    return JSON.parse(localStorage.getItem('academyPurchases') || '[]');
  } catch {
    return [];
  }
};

const savePurchases = (purchases) => {
  localStorage.setItem('academyPurchases', JSON.stringify(purchases));
};

const addPurchaseRequest = (course, student, slipFileName) => {
  if (!course || !student) return;
  const purchases = getPurchases();
  const existing = purchases.find((item) => item.studentEmail === student.email && item.courseName === course.name);
  if (existing) return;

  purchases.push({
    id: `purchase_${Date.now()}`,
    studentEmail: student.email,
    studentPhone: student.phone,
    courseName: course.name,
    coursePrice: course.price,
    courseDescription: course.description,
    bankSlip: slipFileName || 'Uploaded',
    status: 'pending',
    requestedAt: new Date().toISOString()
  });

  savePurchases(purchases);
};

const loadPurchaseDetails = () => {
  const course = JSON.parse(localStorage.getItem('academySelectedCourse') || 'null');
  const student = JSON.parse(localStorage.getItem('academyStudentProfile') || 'null');
  const purchaseCourseName = document.getElementById('purchaseCourseName');
  const purchaseDescription = document.getElementById('purchaseDescription');
  const purchasePrice = document.getElementById('purchasePrice');
  const purchaseBank = document.getElementById('purchaseBank');
  const purchaseAccount = document.getElementById('purchaseAccount');
  const purchaseIfsc = document.getElementById('purchaseIfsc');
  const purchaseMessage = document.getElementById('purchaseMessage');

  if (!student) {
    window.location.href = 'academy.html';
    return;
  }

  if (!course) {
    if (purchaseCourseName) purchaseCourseName.textContent = 'No course selected';
    if (purchaseDescription) purchaseDescription.textContent = 'Please return to the Academy page and choose a course to enroll.';
    if (purchasePrice) purchasePrice.textContent = '-';
    if (purchaseBank) purchaseBank.textContent = '-';
    if (purchaseAccount) purchaseAccount.textContent = '-';
    if (purchaseIfsc) purchaseIfsc.textContent = '-';
    return;
  }

  if (purchaseCourseName) purchaseCourseName.textContent = course.name;
  if (purchaseDescription) purchaseDescription.textContent = course.description;
  if (purchasePrice) purchasePrice.textContent = course.price;
  if (purchaseBank) purchaseBank.textContent = course.bankName;
  if (purchaseAccount) purchaseAccount.textContent = course.accountNumber;
  if (purchaseIfsc) purchaseIfsc.textContent = course.ifsc;

  const bankSlipForm = document.getElementById('bankSlipForm');
  if (bankSlipForm) {
    bankSlipForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const bankSlipInput = document.getElementById('bankSlipUpload');
      if (!bankSlipInput || !bankSlipInput.files || bankSlipInput.files.length === 0) {
        if (purchaseMessage) purchaseMessage.textContent = 'Please upload your bank transfer slip.';
        return;
      }

      const fileName = bankSlipInput.files[0].name;
      addPurchaseRequest(course, student, fileName);
      if (purchaseMessage) purchaseMessage.textContent = 'Bank slip uploaded successfully. We will verify your payment shortly.';
      bankSlipForm.reset();
    });
  }
};

document.addEventListener('DOMContentLoaded', loadPurchaseDetails);
