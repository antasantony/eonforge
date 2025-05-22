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

