document.addEventListener('DOMContentLoaded', function () {

  // Use buttons to toggle between views
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email(reply_mail) {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';

  // Replying mail
  if (Number.isInteger(reply_mail)) {
    // Generate the data for the reply
    reply(reply_mail);
  }
  else {
    // Clear out composition fields
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
  }

  // When Submitting mail
  document.getElementById('send').onclick = function (event) {

    // Prevents auto-redirecting back into 'send' when btn submitted
    event.preventDefault();

    // Get all mail info 
    const reciver = document.querySelector('#compose-recipients');
    const subject = document.querySelector('#compose-subject');
    const message = document.querySelector('#compose-body');

    // Attempt to send the mail and wait for response
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: reciver.value,
        subject: subject.value,
        body: message.value
      })
    })
    .then(response => response.json())
    .then(result => {
        // Print result
        console.log(result);
        return load_mailbox('sent');
    });
  };
}

function load_mailbox(mailbox, mail_id) {

  // Load the mails 
  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
      // Get the mail and run each mail in the render mailsInBox
      emails.forEach(function (email) {
        mailsInBox(email);
      });
    });

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Check if coming from reply btn
  // Replying mail
  if (Number.isInteger(mail_id)) {
    // Generate the data for the reply
    return compose_email(mail_id);
  }
}

function mailsInBox(email) {
  // Generating div getting the mail and make div clickable

  // Making main mailDiv
  const mailDiv = document.createElement("div");
  mailDiv.className = "mailbox";
  if (email.read) {
    mailDiv.className = "mailbox viewedmail";
  }

  document.getElementById('emails-view').appendChild(mailDiv);

  // Making template for the inside divs & data
  const dataDivs = `<div class="databox">From:&emsp; <strong>${email.sender}</strong></div>
                    <div class="databox">Subject:&emsp; <strong>${email.subject}</strong></div>
                    <div class="databox">Date/time:&emsp; <strong>${email.timestamp}</strong></div>`;
  mailDiv.innerHTML = dataDivs;

  // When mail is clicked, run view_email func
  mailDiv.onclick = function () {
    view_email(email.id);
  }
}

function view_email(mail) {
  // The single mail read view

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';

  // Get data from the API about the mail
  fetch(`/emails/${mail}`)
    .then(response => response.json())
    .then(mailData => {

      // Check the currenct Archive status and get name for btn
      if (mailData.archived) {
        archive_btn_text = "Unarchive";
      }
      else {
        archive_btn_text = "Archive";
      }
      // If mail is unread, make it read
      if (!mailData.read) {
        makeMailViewed(mailData.id);
      }

      // Makes divs and place data to display message and archive / unarchive button   
      const dataDivs = `<div class="databox">From:&emsp; <strong>${mailData.sender}</strong></div>
                      <div class="databox">Subject:&emsp; <strong>${mailData.subject}</strong></div>
                      <div class="databox">Recipients:&emsp; <strong>${mailData.recipients}</strong></div>
                      <div class="databox">Date/time:&emsp; <strong>${mailData.timestamp}</strong></div>
                      <div class="databuttons">
                        <button class="btn btn-sm btn-primary" id="reply_btn">Reply</button>
                        <button class="btn btn-sm btn-outline-primary" id="archive_btn">${archive_btn_text}</button>                        
                      </div>
                      <div class ="databox">Message:</div>
                      <div class ="datamessage">${mailData.body}</div>`;
      document.querySelector('#email-view').innerHTML = dataDivs;

      // Archive/unarchive btn and change archived-status
      const archive = document.getElementById('archive_btn');

      archive.addEventListener('click', function () {
        fetch(`/emails/${mail}`, {
          method: 'PUT',
          body: JSON.stringify({
            archived: !mailData.archived
          })
        })
        // load the inbox
        .then(result => {
            return load_mailbox('inbox');
        });
      });

      // Reply button and sending current mail to compose_email() func
      const reply = document.getElementById('reply_btn');
      reply.addEventListener('click', function () {
        return load_mailbox('inbox', mail);
      });
    });

}

function reply(mail_id) {
  // Generates the data for the reply message

  fetch(`/emails/${mail_id}`)
    .then(response => response.json())
    .then(mailData => {
      // Load the composition fields for Reply
      document.querySelector('#compose-recipients').value = mailData.sender;
      document.querySelector('#compose-subject').value = `Re: ${mailData.subject}`;
      document.querySelector('#compose-body').value = `On ${mailData.timestamp} ${mailData.sender} wrote:\n ${mailData.body} \n\n`;
    });
}

function makeMailViewed(mailId) {
  // Makes a mail "viewed"
  fetch(`/emails/${mailId}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: true
    })
  });
}



