import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { AccountContext } from '../../app/App.tsx';
import { AccountUpdateFlagContext } from '../../app/App.tsx';
import SlFormatDate from '@shoelace-style/shoelace/dist/react/format-date';

import SlIconButton from '@shoelace-style/shoelace/dist/react/icon-button';
import SlIcon from '@shoelace-style/shoelace/dist/react/icon';
import SlBadge from '@shoelace-style/shoelace/dist/react/badge';
import SlButton from '@shoelace-style/shoelace/dist/react/button';
import SlDialog from '@shoelace-style/shoelace/dist/react/dialog';
import SlInput from '@shoelace-style/shoelace/dist/react/input';
import { createInvoiceLink, paidPremium } from '../../entities/upload/stars.ts';
import { deletePhone, setPhone } from '../../entities/upload/phone.ts';
import { TelegramWebApp } from '../../entities/utils/telegram.ts';
import { TUser } from '../../entities/types/user/user.ts';


export default function AccountInfo() {

  const navigate = useNavigate();

  const { account, setAccount } = useContext(AccountContext);
  const { setAccountUpdateFlag } = useContext(AccountUpdateFlagContext);
  const [phone, setPhoneValue] = useState(account.getPhone());
  const [phoneDialogOpen, setPhoneDialogOpen] = useState(false);
  const [isPhoneSaving, setIsPhoneSaving] = useState(false);

  const updateAccountPhone = (newPhone: string) => {
    setAccount(new TUser(
      account.getId(),
      account.getTelegramId(),
      account.getFirstName(),
      account.getLastName(),
      account.getExpiredDate(),
      newPhone
    ));
  }

  const handleSavePhone = async () => {
    setIsPhoneSaving(true);
    await setPhone(phone);
    updateAccountPhone(phone);
    setPhoneDialogOpen(false);
    setIsPhoneSaving(false);
  }

  const handleDeletePhone = async () => {
    setIsPhoneSaving(true);
    await deletePhone();
    setPhoneValue('');
    updateAccountPhone('');
    setIsPhoneSaving(false);
  }

  const handleOpenPhoneDialog = () => {
    setPhoneValue(account.getPhone());
    setPhoneDialogOpen(true);
  }

  const handleBuyPremium = (stars: number, days: number) => {
    createInvoiceLink(stars, days)
      .then((link) => {
        TelegramWebApp().openInvoice(link.result, (status: string) => {
          if (status === "paid") {
            paidPremium(days);
            setAccountUpdateFlag(true);
            TelegramWebApp().showPopup({
              title: "Welcome to Premium",
              message: "You have upgraded to Bill Split Premium. Your payment was successful.",
              buttons: [{ type: "close", text: "Close" }],
            })
          } else {
            TelegramWebApp().showPopup({
              title: "Something went wrong",
              message: "Payment failed with status: " + status,
              buttons: [{ type: "close", text: "Close" }],
            })
          }
        })
      })
      // .then(() => {
      //   navigate('/');
      // })
  }

  return (
    <>

      <div style={{ background: 'linear-gradient(rgba(0, 255, 127, 0.4), rgba(0, 0, 255, 0.4))', width: '100%', height: '10rem', boxSizing: 'border-box' }}>
        <div style={{ padding: '1rem' }}>
          <div>
            <SlIconButton name="arrow-left-circle-fill" label="Back" style={{ fontSize: '1.5rem' }} onClick={()=>navigate('/')} />
          </div>
          <div style={{ float: 'left' }}>
            <h2 style={{ marginBottom: '0px' }}>{account.getFirstName()} {account.getLastName()}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', minHeight: '2rem' }}>
              {account.getPhone() && <SlBadge variant="neutral">{account.getPhone()}</SlBadge>}
              <SlIconButton
                name={account.getPhone() ? 'pencil' : 'telephone-plus'}
                label={account.getPhone() ? 'Edit phone number' : 'Add phone number'}
                disabled={isPhoneSaving}
                onClick={handleOpenPhoneDialog}
              />
              {account.getPhone() &&
                <SlIconButton
                  name="trash3"
                  label="Delete phone number"
                  disabled={isPhoneSaving}
                  onClick={handleDeletePhone}
                />
              }
            </div>
            { account.isPremium() ?
              <SlBadge variant="neutral">Premium until&nbsp;<SlFormatDate month="long" day="numeric" year="numeric" date={account.getExpiredDate()}/></SlBadge>
              :
              <></>
            }
          </div>
        </div>
      </div>

      <div style={{ width: '100%', boxSizing: 'border-box', padding: '1rem' }}>
        <SlDialog label="Phone number" open={phoneDialogOpen} onSlAfterHide={() => setPhoneDialogOpen(false)}>
          <SlInput
            type="tel"
            value={phone}
            placeholder="Enter your phone number"
            onSlInput={(e) => setPhoneValue((e.target as HTMLInputElement).value)}
          />
          <SlButton slot="footer" variant="neutral" disabled={isPhoneSaving} onClick={() => setPhoneDialogOpen(false)}>
            Cancel
          </SlButton>
          <SlButton
            slot="footer"
            variant="success"
            loading={isPhoneSaving}
            disabled={isPhoneSaving}
            onClick={handleSavePhone}
          >
            Save
          </SlButton>
        </SlDialog>

        <div style={{ width: '100%', paddingBottom: '0px', border: 'solid 1px #444', borderRadius: '8px' }}>
          <div style={{ backgroundColor: '#444', padding: '10px', marginTop: '0px', borderTopLeftRadius: '7px', borderTopRightRadius: '7px' }}>
            <span style={{ fontWeight: 'bold', color: '#fff' }}>Premium</span>
          </div>
          <div>
            <div style={{ margin: '10px' }}>
              <SlIcon name='collection-fill' style={{ fontSize: '24px', color: '#444', float: 'left' }} />
              <span style={{ fontSize: '16px', marginLeft: '10px', marginTop: '5px', float: 'left' }} >Unlimited groups</span>
              <div style={{ clear: 'both' }} ></div>
            </div>
            <div style={{ margin: '10px' }}>
              <SlIcon name='credit-card-2-back-fill' style={{ fontSize: '24px', color: '#444', float: 'left' }} />
              <span style={{ fontSize: '16px', marginLeft: '10px', marginTop: '5px', float: 'left' }} >Unlimited expenses</span>
              <div style={{ clear: 'both' }} ></div>
            </div>
            <div style={{ margin: '10px' }}>
              <SlIcon name='clipboard2-check-fill' style={{ fontSize: '24px', color: '#444', float: 'left' }} />
              <span style={{ fontSize: '16px', marginLeft: '10px', marginTop: '5px', float: 'left' }} >Optimize payments</span>
              <div style={{ clear: 'both' }} ></div>
            </div>
            <div style={{ margin: '10px' }}>
              <SlIcon name='currency-exchange' style={{ fontSize: '24px', color: '#444', float: 'left' }} />
              <span style={{ fontSize: '16px', marginLeft: '10px', marginTop: '5px', float: 'left' }} >Convert to target currency</span>
              <div style={{ clear: 'both' }} ></div>
            </div>
          </div>
          <div>
            <hr />
            <SlButton 
              variant="primary" 
              style={{ marginBottom: '0.5rem', marginLeft: '0.5rem', width: '30%' }} 
              onClick={() => handleBuyPremium(49, 10)}
            >
              <span style={{ display: 'block', marginBottom: '-15px' }} >10 days</span>
              49 <SlIcon name='star-fill' style={{ fontSize: '14px', color: 'yellow' }} />
            </SlButton>
            <SlButton 
              variant="primary" 
              style={{ marginBottom: '0.5rem', marginLeft: '0.5rem', width: '30%' }} 
              onClick={() => handleBuyPremium(99, 30)}
            >
              <span style={{ display: 'block', marginBottom: '-15px' }} >30 days</span>
              99 <SlIcon name='star-fill' style={{ fontSize: '14px', color: 'yellow' }} />
            </SlButton>
            <SlButton 
              variant="primary" 
              style={{ marginBottom: '0.5rem', marginLeft: '0.5rem', width: '30%' }} 
              onClick={() => handleBuyPremium(999, 365)}
            >
              <span style={{ display: 'block', marginBottom: '-15px' }} >365 days</span>
              999 <SlIcon name='star-fill' style={{ fontSize: '14px', color: 'yellow' }} />
            </SlButton>
          </div>
        </div>

      </div>
    </>
  );
}
