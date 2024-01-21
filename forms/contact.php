<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

$receiving_email_address = 'almas_muzamil@hotmail.com';

if (file_exists($php_email_form = '../assets/vendor/php-email-form/php-email-form.php')) {
  include($php_email_form);
} else {
  die('Unable to load the "PHP Email Form" Library!');
}

if (isset($_POST['name']) && isset($_POST['email']) && isset($_POST['subject']) && isset($_POST['message'])) {
  $contact = new PHP_Email_Form;
  $contact->ajax = true;

  $contact->to = $receiving_email_address;
  $contact->from_name = $_POST['name'];
  $contact->from_email = $_POST['email'];
  $contact->subject = $_POST['subject'];

  $contact->smtp = array(
    'host' => 'smtp.gmail.com',
    'username' => 'bianajan1@gmail.com',
    'password' => 'Khankhan12345',
    'port' => '587'
  );

  $contact->add_message($_POST['name'], 'From');
  $contact->add_message($_POST['email'], 'Email');
  $contact->add_message($_POST['message'], 'Message', 10);

  echo $contact->send();
} else {
  echo 'Required fields are missing.';
}
