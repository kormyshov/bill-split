import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { AccountContext, AccountUpdateFlagContext } from '../../app/App';
import { createInvoiceLink, paidPremium } from '../../entities/upload/stars';
import { deletePhone, setPhone } from '../../entities/upload/phone';
import { haptic, TelegramWebApp } from '../../entities/utils/telegram';
import { TUser } from '../../entities/types/user/user';
import { Avatar, GroupedList, Icon, ListRow, Modal, PrimaryButton, personName, TopBar } from '../../widgets/telegram-ui';

const PLANS = [
  { label: '10 days', stars: 49, days: 10 },
  { label: '1 month', stars: 99, days: 30 },
  { label: '1 year', stars: 999, days: 365 },
];

export default function AccountInfo() {
  const navigate = useNavigate();
  const { account, setAccount } = useContext(AccountContext);
  const { setAccountUpdateFlag } = useContext(AccountUpdateFlagContext);
  const [phone, setPhoneValue] = useState(account.getPhone());
  const [phoneDialogOpen, setPhoneDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isPhoneSaving, setIsPhoneSaving] = useState(false);

  const updateAccountPhone = (newPhone: string) => setAccount(new TUser(account.getId(), account.getTelegramId(), account.getFirstName(), account.getLastName(), account.getExpiredDate(), newPhone));

  const handleSavePhone = async () => {
    setIsPhoneSaving(true);
    await setPhone(phone);
    updateAccountPhone(phone);
    setPhoneDialogOpen(false);
    setIsPhoneSaving(false);
    haptic('success');
  };

  const handleDeletePhone = async () => {
    setIsPhoneSaving(true);
    await deletePhone();
    setPhoneValue('');
    updateAccountPhone('');
    setIsPhoneSaving(false);
    setDeleteDialogOpen(false);
    haptic('warning');
  };

  const handleBuyPremium = (stars: number, days: number) => {
    haptic('selection');
    createInvoiceLink(stars, days).then(link => {
      TelegramWebApp().openInvoice(link.result, (status: string) => {
        if (status === 'paid') {
          paidPremium(days);
          setAccountUpdateFlag(true);
          haptic('success');
          TelegramWebApp().showPopup({ title: 'Welcome to Premium', message: 'Your Bill Split Premium upgrade was successful.', buttons: [{ type: 'close', text: 'Close' }] });
        } else if (status !== 'cancelled') {
          haptic('error');
          TelegramWebApp().showPopup({ title: 'Payment not completed', message: `Payment finished with status: ${status}.`, buttons: [{ type: 'close', text: 'Close' }] });
        }
      });
    });
  };

  const name = personName(account.getFirstName(), account.getLastName());
  const premiumDate = account.getExpiredDate() ? new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(account.getExpiredDate())) : '';

  return (
    <main className="tg-page">
      <TopBar title="Account & Premium" onBack={() => navigate('/')} />
      <div className="tg-page-content is-padded-top">
        <GroupedList>
          <div className="tg-profile-row">
            <Avatar name={name} size="lg" />
            <div className="tg-profile-row-copy">
              <strong>{name}</strong>
              {account.isPremium() && <span className="tg-profile-premium"><Icon name="star" size={13} /> Premium until {premiumDate}</span>}
            </div>
          </div>
          <div className="tg-phone-row">
            <span className="tg-phone-icon"><Icon name="phone" size={18} /></span>
            <span className="tg-row-copy"><span className="tg-row-title">{account.getPhone() || 'Phone number'}</span><span className="tg-row-subtitle">{account.getPhone() ? 'Used in your account details' : 'Not added yet'}</span></span>
            <button className="tg-icon-button" type="button" onClick={() => { setPhoneValue(account.getPhone()); setPhoneDialogOpen(true); }} aria-label={account.getPhone() ? 'Edit phone' : 'Add phone'}><Icon name="edit" size={17} /></button>
            {account.getPhone() && <button className="tg-icon-button is-destructive" type="button" onClick={() => setDeleteDialogOpen(true)} aria-label="Remove phone"><Icon name="trash" size={17} /></button>}
          </div>
        </GroupedList>

        <h2 className="tg-section-title">Premium benefits</h2>
        <GroupedList>
          <ListRow leading={<span className="tg-benefit-icon"><Icon name="sparkles" size={20} /></span>} title="Scan receipts" className="no-inset" />
          <ListRow leading={<span className="tg-benefit-icon"><Icon name="users" size={20} /></span>} title="Unlimited groups" className="no-inset" />
          <ListRow leading={<span className="tg-benefit-icon"><Icon name="card" size={20} /></span>} title="Unlimited expenses" className="no-inset" />
          <ListRow leading={<span className="tg-benefit-icon"><Icon name="check" size={20} /></span>} title="Optimize payments" className="no-inset" />
          <ListRow leading={<span className="tg-benefit-icon"><Icon name="currency" size={20} /></span>} title="Convert to target currency" className="no-inset" />
        </GroupedList>

        <h2 className="tg-section-title">Choose your plan</h2>
        <div className="tg-plan-grid">
          {PLANS.map((plan, index) => (
            <button type="button" className={`tg-plan ${index === 1 ? 'is-selected' : ''}`} key={plan.days} onClick={() => handleBuyPremium(plan.stars, plan.days)}>
              <small>{plan.label}</small>
              <strong><Icon name="star" size={15} /> {plan.stars}</strong>
              <span>Telegram Stars</span>
            </button>
          ))}
        </div>
      </div>

      <Modal
        open={phoneDialogOpen}
        title={account.getPhone() ? 'Edit phone number' : 'Add phone number'}
        onClose={() => setPhoneDialogOpen(false)}
        footer={<><PrimaryButton outline disabled={isPhoneSaving} onClick={() => setPhoneDialogOpen(false)}>Cancel</PrimaryButton><PrimaryButton disabled={isPhoneSaving || !phone.trim()} onClick={handleSavePhone}>{isPhoneSaving ? 'Saving…' : 'Save'}</PrimaryButton></>}
      >
        <label className="tg-modal-field-label" htmlFor="account-phone">Phone number</label>
        <input id="account-phone" className="tg-text-input" type="tel" inputMode="tel" value={phone} placeholder="+381 00 000 0000" onChange={event => setPhoneValue(event.target.value)} autoFocus />
        <p className="tg-modal-hint">Include the country code.</p>
      </Modal>

      <Modal
        open={deleteDialogOpen}
        title="Remove phone number?"
        onClose={() => setDeleteDialogOpen(false)}
        footer={<><PrimaryButton outline onClick={() => setDeleteDialogOpen(false)}>Cancel</PrimaryButton><PrimaryButton destructive disabled={isPhoneSaving} onClick={handleDeletePhone}>Remove</PrimaryButton></>}
      >
        <p>Your phone number will be removed from Bill Split.</p>
      </Modal>
    </main>
  );
}
