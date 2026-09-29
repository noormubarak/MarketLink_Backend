import React, { useState } from 'react';
import { FaEnvelope, FaPaperPlane, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import './Contact.css';

const Contact = () => {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!message.trim() || sending) return;

    setSending(true);
    setError('');
    setSent(false);
    try {
      await api.post('/contact', { subject: subject.trim(), message: message.trim() });
      setSubject('');
      setMessage('');
      setSent(true);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Your message could not be sent. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="contact-page">
      <div className="contact-container">
        <section className="contact-info">
          <span className="contact-eyebrow"><FaEnvelope /> MarketLink Support</span>
          <h1>How can we help?</h1>
          <p className="contact-intro">
            Send a message to the MarketLink team. Your message will be shared with our support team,
            and we’ll follow up using the email on your account.
          </p>
          <div className="contact-topics">
            <div className="contact-topic">
              <strong>Orders and pickup</strong>
              <p>Questions about an order, pickup date, or a local farmer?</p>
            </div>
            <div className="contact-topic">
              <strong>Your account</strong>
              <p>Need help with your profile or using MarketLink?</p>
            </div>
            <div className="contact-topic">
              <strong>Feedback</strong>
              <p>Share an idea that could make your experience better.</p>
            </div>
          </div>
          <div className="contact-account-note">
            <span className="contact-account-mark">{user?.name?.charAt(0).toUpperCase() || 'C'}</span>
            <span>Sending as <strong>{user?.name}</strong><br />{user?.email}</span>
          </div>
        </section>

        <form className="contact-form" onSubmit={handleSubmit}>
          {sent && (
            <div className="contact-feedback success" role="status">
              <FaCheckCircle /> Your message has been sent.
            </div>
          )}
          {error && <div className="contact-feedback error" role="alert">{error}</div>}

          <div className="contact-field-row">
            <div className="contact-field">
              <label htmlFor="contact-name">Your name</label>
              <input id="contact-name" type="text" value={user?.name || ''} readOnly />
            </div>
            <div className="contact-field">
              <label htmlFor="contact-email">Email address</label>
              <input id="contact-email" type="email" value={user?.email || ''} readOnly />
            </div>
          </div>

          <div className="contact-field">
            <label htmlFor="contact-subject">Subject <span>(optional)</span></label>
            <input
              id="contact-subject"
              type="text"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              maxLength={120}
              placeholder="What can we help with?"
            />
          </div>

          <div className="contact-field">
            <label htmlFor="contact-message">Message</label>
            <textarea
              id="contact-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={3000}
              rows={7}
              required
              placeholder="Write your message..."
            />
            <span className="contact-character-count">{message.length}/3000</span>
          </div>

          <button className="contact-submit" type="submit" disabled={sending || !message.trim()}>
            {sending ? <><FaSpinner className="contact-spinner" /> Sending...</> : <><FaPaperPlane /> Send message</>}
          </button>
        </form>
      </div>
    </main>
  );
};

export default Contact;