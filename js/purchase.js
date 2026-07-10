/**
 * purchase.js — Course Purchase & Bank Slip Upload
 * Uses Firebase Auth (via auth.js) to identify the student.
 */

import { database, ref, push, set, IMGBB_API_KEY } from './firebase-config.js';
import { getCurrentStudent, onStudentAuthChanged, setNavAccountState } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
  const purchaseCourseName  = document.getElementById('purchaseCourseName');
  const purchaseDescription = document.getElementById('purchaseDescription');
  const purchasePrice       = document.getElementById('purchasePrice');
  const purchaseBank        = document.getElementById('purchaseBank');
  const purchaseAccount     = document.getElementById('purchaseAccount');
  const purchaseIfsc        = document.getElementById('purchaseIfsc');
  const bankSlipForm        = document.getElementById('bankSlipForm');
  const bankSlipUpload      = document.getElementById('bankSlipUpload');
  const purchaseMessage     = document.getElementById('purchaseMessage');

  // Update nav icon based on auth state
  onStudentAuthChanged((authData) => {
    setNavAccountState(!!(authData && authData.student));
  });

  // Load selected course from localStorage
  const selectedCourse = JSON.parse(localStorage.getItem('academySelectedCourse') || 'null');

  if (!selectedCourse) {
    if (purchaseCourseName) purchaseCourseName.textContent = 'No course selected';
    if (bankSlipForm) {
      const btn = bankSlipForm.querySelector('button');
      if (btn) btn.disabled = true;
    }
    return;
  }

  if (purchaseCourseName)  purchaseCourseName.textContent  = selectedCourse.name;
  if (purchaseDescription) purchaseDescription.textContent = selectedCourse.description;
  if (purchasePrice)       purchasePrice.textContent       = selectedCourse.price;
  if (purchaseBank)        purchaseBank.textContent        = selectedCourse.bankName;
  if (purchaseAccount)     purchaseAccount.textContent     = selectedCourse.accountNumber;
  if (purchaseIfsc)        purchaseIfsc.textContent        = selectedCourse.ifsc;

  // Upload to ImgBB
  const uploadToImgBB = async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData
    });
    const result = await res.json();
    if (result.success) {
      return result.data.url;
    }
    throw new Error(result.error?.message || 'ImgBB upload failed');
  };

  // Bank slip form submission
  if (bankSlipForm && bankSlipUpload && purchaseMessage) {
    bankSlipForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const file = bankSlipUpload.files[0];
      if (!file) {
        purchaseMessage.textContent = 'Please select a file to upload.';
        purchaseMessage.style.color = '#FCA5A5';
        return;
      }

      // Check auth via Firebase
      const authData = await getCurrentStudent();
      if (!authData || !authData.student) {
        purchaseMessage.textContent = 'You must be logged in to purchase a course.';
        purchaseMessage.style.color = '#FCA5A5';
        return;
      }

      const student = authData.student;
      const submitBtn = bankSlipForm.querySelector('button');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Uploading slip...';
      purchaseMessage.textContent = '';

      try {
        const imgUrl = await uploadToImgBB(file);

        const purchasesRef = ref(database, 'purchases');
        const newPurchaseRef = push(purchasesRef);
        await set(newPurchaseRef, {
          studentUid:   student.uid,
          studentEmail: student.email,
          studentPhone: student.phone || '',
          studentName:  student.name  || '',
          courseName:   selectedCourse.name,
          bankSlip:     imgUrl,
          status:       'pending',
          createdAt:    new Date().toISOString()
        });

        purchaseMessage.textContent = 'Upload successful! Waiting for admin approval.';
        purchaseMessage.style.color = '#A7F3D0';
        bankSlipForm.reset();

      } catch (error) {
        console.error(error);
        purchaseMessage.textContent = 'Upload failed. ' + error.message;
        purchaseMessage.style.color = '#FCA5A5';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Upload Slip';
      }
    });
  }
});
