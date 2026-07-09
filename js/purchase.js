import { database, ref, push, set, get, child, IMGBB_API_KEY } from './firebase-config.js';

document.addEventListener('DOMContentLoaded', () => {
  const purchaseCourseName = document.getElementById('purchaseCourseName');
  const purchaseDescription = document.getElementById('purchaseDescription');
  const purchasePrice = document.getElementById('purchasePrice');
  const purchaseBank = document.getElementById('purchaseBank');
  const purchaseAccount = document.getElementById('purchaseAccount');
  const purchaseIfsc = document.getElementById('purchaseIfsc');
  const bankSlipForm = document.getElementById('bankSlipForm');
  const bankSlipUpload = document.getElementById('bankSlipUpload');
  const purchaseMessage = document.getElementById('purchaseMessage');

  // Load selected course from local storage (to know what we are buying)
  const selectedCourse = JSON.parse(localStorage.getItem('academySelectedCourse') || 'null');
  
  if (!selectedCourse) {
    if (purchaseCourseName) purchaseCourseName.textContent = 'No course selected';
    if (bankSlipForm) {
      const btn = bankSlipForm.querySelector('button');
      if (btn) btn.disabled = true;
    }
    return;
  }

  if (purchaseCourseName) purchaseCourseName.textContent = selectedCourse.name;
  if (purchaseDescription) purchaseDescription.textContent = selectedCourse.description;
  if (purchasePrice) purchasePrice.textContent = selectedCourse.price;
  if (purchaseBank) purchaseBank.textContent = selectedCourse.bankName;
  if (purchaseAccount) purchaseAccount.textContent = selectedCourse.accountNumber;
  if (purchaseIfsc) purchaseIfsc.textContent = selectedCourse.ifsc;

  // Utility to upload images to ImgBB
  const uploadToImgBB = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData
      });
      const result = await res.json();
      if (result.success) {
        return result.data.url;
      } else {
        throw new Error(result.error.message || 'ImgBB upload failed');
      }
    } catch (err) {
      console.error('ImgBB Error:', err);
      throw err;
    }
  };

  if (bankSlipForm && bankSlipUpload && purchaseMessage) {
    bankSlipForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const file = bankSlipUpload.files[0];
      if (!file) {
        purchaseMessage.textContent = 'Please select a file to upload.';
        purchaseMessage.style.color = '#FCA5A5';
        return;
      }

      // Check if student is logged in via local storage profile
      const student = JSON.parse(localStorage.getItem('academyStudentProfile') || 'null');
      if (!student || !student.email) {
        purchaseMessage.textContent = 'You must be logged in to purchase a course.';
        purchaseMessage.style.color = '#FCA5A5';
        return;
      }

      const submitBtn = bankSlipForm.querySelector('button');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Uploading slip...';
      purchaseMessage.textContent = '';

      try {
        // Upload image to ImgBB
        const imgUrl = await uploadToImgBB(file);
        
        // Save purchase record to Firebase
        const purchasesRef = ref(database, 'purchases');
        const newPurchaseRef = push(purchasesRef);
        await set(newPurchaseRef, {
          studentEmail: student.email,
          studentPhone: student.phone || '',
          courseName: selectedCourse.name,
          bankSlip: imgUrl,
          status: 'pending',
          createdAt: new Date().toISOString()
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
