// document.addEventListener("DOMContentLoaded", () => {
//     // Sample user data
//     const sampleUsers = [
//       {
//         id: "USR12345",
//         name: "John Doe",
//         email: "john.doe@example.com",
//         role: "customer",
//         status: "active",
//         joinedDate: "Jan 15, 2023",
//         lastLogin: "Today, 10:30 AM",
//         phone: "+1 (555) 123-4567",
//         orders: 24,
//         totalSpent: "$1,248.50",
//         address: "123 Main St, New York, NY 10001",
//       },
//       {
//         id: "USR12346",
//         name: "Jane Smith",
//         email: "jane.smith@example.com",
//         role: "admin",
//         status: "active",
//         joinedDate: "Mar 22, 2022",
//         lastLogin: "Yesterday, 15:45 PM",
//         phone: "+1 (555) 987-6543",
//         orders: 0,
//         totalSpent: "$0.00",
//         address: "456 Park Ave, Boston, MA 02108",
//       },
//       {
//         id: "USR12347",
//         name: "Robert Johnson",
//         email: "robert.j@example.com",
//         role: "customer",
//         status: "inactive",
//         joinedDate: "Apr 10, 2023",
//         lastLogin: "3 weeks ago",
//         phone: "+1 (555) 456-7890",
//         orders: 3,
//         totalSpent: "$149.99",
//         address: "789 Oak St, Chicago, IL 60007",
//       },
//       {
//         id: "USR12348",
//         name: "Emily Davis",
//         email: "emily.davis@example.com",
//         role: "vendor",
//         status: "active",
//         joinedDate: "Feb 05, 2023",
//         lastLogin: "2 days ago",
//         phone: "+1 (555) 234-5678",
//         orders: 0,
//         totalSpent: "$0.00",
//         address: "321 Pine St, San Francisco, CA 94101",
//       },
//       {
//         id: "USR12349",
//         name: "Michael Wilson",
//         email: "michael.w@example.com",
//         role: "customer",
//         status: "blocked",
//         joinedDate: "Nov 18, 2022",
//         lastLogin: "2 months ago",
//         phone: "+1 (555) 876-5432",
//         orders: 7,
//         totalSpent: "$432.75",
//         address: "654 Maple Ave, Miami, FL 33101",
//       },
//       {
//         id: "USR12350",
//         name: "Sarah Brown",
//         email: "sarah.b@example.com",
//         role: "customer",
//         status: "active",
//         joinedDate: "May 30, 2023",
//         lastLogin: "Today, 09:15 AM",
//         phone: "+1 (555) 345-6789",
//         orders: 12,
//         totalSpent: "$876.25",
//         address: "987 Cedar Rd, Seattle, WA 98101",
//       },
//     ]
  
//     // Populate users table
//     function populateUsersTable(users) {
//       const tableBody = document.querySelector("#users-table tbody")
//       tableBody.innerHTML = ""
  
//       users.forEach((user) => {
//         const row = document.createElement("tr")
  
//         // Get first name only
//         const firstName = user.name.split(" ")[0]
  
//         // Determine block/unblock button text and class
//         const blockActionText = user.status === "blocked" ? "Unblock" : "Block"
//         const blockActionIcon = user.status === "blocked" ? "fa-unlock" : "fa-ban"
//         const blockActionClass = user.status === "blocked" ? "unblock" : "block"
  
//         row.innerHTML = `
//           <td><input type="checkbox" class="user-checkbox" data-id="${user.id}"></td>
//           <td>${user.id}</td>
//           <td>${firstName}</td>
//           <td>${user.email}</td>
//           <td>${user.joinedDate}</td>
//           <td class="user-actions-cell">
//             <button class="action-btn ${blockActionClass}" data-id="${user.id}" title="${blockActionText} User">
//               <i class="fas ${blockActionIcon}"></i> ${blockActionText}
//             </button>
//           </td>
//         `
  
//         tableBody.appendChild(row)
//       })
  
//       // Add event listeners to block/unblock buttons
//       document.querySelectorAll(".action-btn.block, .action-btn.unblock").forEach((btn) => {
//         btn.addEventListener("click", function () {
//           const userId = this.getAttribute("data-id")
//           const isBlocked = this.classList.contains("unblock")
//           toggleUserBlockStatus(userId, isBlocked)
//         })
//       })
//     }
  
//     // Function to toggle user block status
//     function toggleUserBlockStatus(userId, isCurrentlyBlocked) {
//       // Find the user
//       const userIndex = sampleUsers.findIndex((u) => u.id === userId)
  
//       if (userIndex !== -1) {
//         // Toggle the status
//         sampleUsers[userIndex].status = isCurrentlyBlocked ? "active" : "blocked"
  
//         // Refresh the table
//         populateUsersTable(sampleUsers)
  
//         // Show feedback
//         alert(`User ${isCurrentlyBlocked ? "unblocked" : "blocked"} successfully`)
//       }
//     }
  
//     // Initialize table
//     populateUsersTable(sampleUsers)
  
//     // Filter users
//     document.getElementById("user-status-filter").addEventListener("change", function () {
//       const statusFilter = this.value
//       const roleFilter = document.getElementById("user-role-filter").value
  
//       filterUsers(statusFilter, roleFilter)
//     })
  
//     document.getElementById("user-role-filter").addEventListener("change", function () {
//       const roleFilter = this.value
//       const statusFilter = document.getElementById("user-status-filter").value
  
//       filterUsers(statusFilter, roleFilter)
//     })
  
//     function filterUsers(status, role) {
//       let filteredUsers = [...sampleUsers]
  
//       if (status !== "all") {
//         filteredUsers = filteredUsers.filter((user) => user.status === status)
//       }
  
//       if (role !== "all") {
//         filteredUsers = filteredUsers.filter((user) => user.role === role)
//       }
  
//       populateUsersTable(filteredUsers)
//     }
  
//     // Search functionality
//     const searchInput = document.querySelector(".search-input")
//     searchInput.addEventListener("input", function () {
//       const searchTerm = this.value.toLowerCase().trim()
  
//       if (searchTerm === "") {
//         populateUsersTable(sampleUsers)
//         return
//       }
  
//       const filteredUsers = sampleUsers.filter(
//         (user) =>
//           user.name.toLowerCase().includes(searchTerm) ||
//           user.email.toLowerCase().includes(searchTerm) ||
//           user.id.toLowerCase().includes(searchTerm),
//       )
  
//       populateUsersTable(filteredUsers)
//     })
  
//     // Select all users checkbox
//     document.getElementById("select-all-users").addEventListener("change", function () {
//       const checkboxes = document.querySelectorAll(".user-checkbox")
//       checkboxes.forEach((checkbox) => {
//         checkbox.checked = this.checked
//       })
//     })
  
//     // User modal functionality
//     function openUserModal(user) {
//       // Populate modal with user data
//       document.getElementById("modal-user-name").textContent = user.name
//       document.getElementById("modal-user-email").textContent = user.email
//       document.getElementById("modal-user-role").textContent = user.role
//       document.getElementById("modal-user-role").className = `role ${user.role}`
//       document.getElementById("modal-user-id").textContent = user.id
//       document.getElementById("modal-user-status").textContent = user.status
//       document.getElementById("modal-user-joined").textContent = user.joinedDate
//       document.getElementById("modal-user-last-login").textContent = user.lastLogin
//       document.getElementById("modal-user-phone").textContent = user.phone
//       document.getElementById("modal-user-orders").textContent = user.orders
//       document.getElementById("modal-user-spent").textContent = user.totalSpent
//       document.getElementById("modal-user-address").textContent = user.address
  
//       // Show modal
//       document.getElementById("user-modal").style.display = "block"
//     }
  
//     // Close modal
//     document.querySelector(".close-modal").addEventListener("click", () => {
//       document.getElementById("user-modal").style.display = "none"
//     })
  
//     // Close modal when clicking outside
//     window.addEventListener("click", (event) => {
//       const modal = document.getElementById("user-modal")
//       if (event.target === modal) {
//         modal.style.display = "none"
//       }
//     })
  
//     // Add New User button
//     document.querySelector(".add-user-btn").addEventListener("click", () => {
//       alert("Add New User functionality would go here")
//       // In a real application, this would open a form modal to add a new user
//     })
  
//     // Mobile menu toggle
//     const menuToggle = document.querySelector(".menu-toggle")
//     menuToggle.addEventListener("click", () => {
//       document.querySelector(".sidebar").classList.toggle("active")
//     })
  
//     // Update stats
//     document.getElementById("total-users").textContent = sampleUsers.length
//     document.getElementById("active-users").textContent = sampleUsers.filter((user) => user.status === "active").length
  
//     // Add clear search functionality
//     const searchClearBtn = document.querySelector(".search-clear-btn")
//     searchClearBtn.addEventListener("click", () => {
//       const searchInput = document.querySelector(".search-input")
//       searchInput.value = ""
//       populateUsersTable(sampleUsers)
//     })
//   })
       


// const blockUser = async (id) => {
//     if(confirm('Are you sure you want to block this user?')){
//         try{
//             const response= await fetch(`/admin/blockCustomer?id=_id`);
//             if(response.ok){
//                 location.reloaded()
// ;            }else{
//         alert('something went wrong');
//            }
//         }catch(err){
//             console.log(err);
//             alert('Something went wrong.')
//         }
//     }
    
// }

// const  unblockUser = async (id)=> {
//     if (confirm('Are you sure you want to unblock this user?')) {
//       try {
//         const response = await fetch(`/admin/unBlockCustomer?id=${userId}`);
//         if (response.ok) {
//           location.reload();
//         } else {
//           alert("Failed to unblock the user.");
//         }
//       } catch (err) {
//         console.error(err);
//         alert("Something went wrong.");
//       }
//     }
//   }

//   async function blockUser(id) {
//     if (confirm('Are you sure you want to block this user?')) {
//       const res = await fetch('/admin/blockCustomer', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({ id })
//       });
//       const result = await res.json();
//       if (result.success) {
//         // location.reload();
//         window.location.href = result.redirectUrl;
//       } else {
//         alert('Failed to block user');
//       }
//     }
//   }

//   async function unblockUser(id) {
//     if (confirm('Are you sure you want to unblock this user?')) {
//       const res = await fetch('/admin/unblockCustomer', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({ id })
//       });
//       const result = await res.json();
//       if (result.success) {
//         // location.reload();
//         window.location.href = result.redirectUrl;
//       } else {
//         alert('Failed to unblock user');
//       }
//     }
//   }


async function blockCustomer(id) {
  const confirm = await Swal.fire({
    title: 'Are you sure?',
    text: 'You are about to block this user.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Yes, block'
  });

  if (confirm.isConfirmed) {
    const res = await fetch('/admin/blockCustomer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });

    const result = await res.json();
    if (result.success) {
      Swal.fire({
        icon: 'success',
        title: 'User blocked',
        showConfirmButton: false,
        timer: 1000
      }).then(() => {
        window.location.href = result.redirectUrl;
      });
    } else {
      Swal.fire('Failed', 'Could not block the user', 'error');
    }
  }
}

async function unblockCustomer(id) {
  const confirm = await Swal.fire({
    title: 'Are you sure?',
    text: 'You are about to unblock this user.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#28a745',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Yes, unblock'
  });

  if (confirm.isConfirmed) {
    const res = await fetch('/admin/unblockCustomer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });

    const result = await res.json();
    if (result.success) {
      Swal.fire({
        icon: 'success',
        title: 'User unblocked',
        showConfirmButton: false,
        timer: 1000
      }).then(() => {
        window.location.href = result.redirectUrl;
      });
    } else {
      Swal.fire('Failed', 'Could not unblock the user', 'error');
    }
  }
}

