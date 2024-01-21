<?php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'path/to/PHPMailer/src/Exception.php';
require 'path/to/PHPMailer/src/PHPMailer.php';
require 'path/to/PHPMailer/src/SMTP.php';

class PHP_Email_Form
{
    public $to;
    public $from_name;
    public $from_email;
    public $subject;
    public $message;
    public $ajax = false;
    public $smtp = array();

    public function add_message($message, $title, $length = 35)
    {
        $this->message .= "<strong>" . $title . "</strong>: " . wordwrap(strip_tags($message), $length, "\r\n") . "\r\n";
    }

    public function send()
    {
        $mail = new PHPMailer(true);

        try {
            //Server settings
            $mail->isSMTP();
            $mail->Host       = $this->smtp['host'];
            $mail->SMTPAuth   = true;
            $mail->Username   = $this->smtp['username'];
            $mail->Password   = $this->smtp['password'];
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = $this->smtp['port'];

            //Recipients
            $mail->setFrom($this->from_email, $this->from_name);
            $mail->addAddress($this->to);

            //Content
            $mail->isHTML(false);
            $mail->Subject = $this->subject;
            $mail->Body    = $this->message;

            $mail->send();
            return true;
        } catch (Exception $e) {
            return "Message could not be sent. Mailer Error: {$mail->ErrorInfo}";
        }
    }
}
