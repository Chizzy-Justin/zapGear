$(document).ready(function() {
    $('.collapse').on('show.bs.collapse', function() {
      $(this).parent().find('.btn').removeClass('btn-link').addClass('btn-dark');
    });
  
    $('.collapse').on('hide.bs.collapse', function() {
      $(this).parent().find('.btn').removeClass('btn-dark').addClass('btn-link');
    });
  
//     $('#confirmOrder').click(function() {
//       alert('Redirecting to payment gateway...');
//       // Here you would typically redirect to a payment gateway
//       window.location.href = 'https://payment-gateway.example.com';
//     });
 });
  