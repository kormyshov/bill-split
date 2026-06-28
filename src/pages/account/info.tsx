import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';

import { AccountContext } from '../../app/App.tsx';
import { AccountUpdateFlagContext } from '../../app/App.tsx';
import SlFormatDate from '@shoelace-style/shoelace/dist/react/format-date';

import SlIconButton from '@shoelace-style/shoelace/dist/react/icon-button';
import SlIcon from '@shoelace-style/shoelace/dist/react/icon';
import SlBadge from '@shoelace-style/shoelace/dist/react/badge';
import SlButton from '@shoelace-style/shoelace/dist/react/button';
import { createInvoiceLink, paidPremium } from '../../entities/upload/stars.ts';


export default function AccountInfo() {

  const navigate = useNavigate();

  const { account } = useContext(AccountContext);
  const { setAccountUpdateFlag } = useContext(AccountUpdateFlagContext);

  const handleBuyPremium = async (stars: number, days: number) => {
    const link = await createInvoiceLink(stars, days);
    console.log(link.result)
    window.Telegram.WebApp.openInvoice(link.result, (status: string) => {
        if (status === "paid") {
          paidPremium(days);
          setAccountUpdateFlag(true)
        }
    });
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
            { account.isPremium() ?
              <SlBadge variant="neutral">Premium until&nbsp;<SlFormatDate month="long" day="numeric" year="numeric" date={account.getExpiredDate()}/></SlBadge>
              :
              <></>
            }
          </div>
        </div>
      </div>

      <div style={{ width: '100%', boxSizing: 'border-box', padding: '1rem' }}>
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
          </div>
          <div>
            <hr />
            <SlButton 
              variant="primary" 
              style={{ marginBottom: '0.5rem', marginLeft: '0.5rem', width: '30%' }} 
              onClick={() => handleBuyPremium(1, 10)}
            >
              <span style={{ display: 'block', marginBottom: '-15px' }} >10 days</span>
              50 <SlIcon name='star-fill' style={{ fontSize: '14px', color: 'yellow' }} />
            </SlButton>
            <SlButton 
              variant="primary" 
              style={{ marginBottom: '0.5rem', marginLeft: '0.5rem', width: '30%' }} 
              onClick={() => handleBuyPremium(1, 30)}
            >
              <span style={{ display: 'block', marginBottom: '-15px' }} >30 days</span>
              100 <SlIcon name='star-fill' style={{ fontSize: '14px', color: 'yellow' }} />
            </SlButton>
            <SlButton 
              variant="primary" 
              style={{ marginBottom: '0.5rem', marginLeft: '0.5rem', width: '30%' }} 
              onClick={() => handleBuyPremium(1, 365)}
            >
              <span style={{ display: 'block', marginBottom: '-15px' }} >365 days</span>
              1000 <SlIcon name='star-fill' style={{ fontSize: '14px', color: 'yellow' }} />
            </SlButton>
          </div>
        </div>

      </div>
    </>
  );
}
